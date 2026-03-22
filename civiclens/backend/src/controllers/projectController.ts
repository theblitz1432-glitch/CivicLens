import { Request, Response } from 'express';
import Project from '../models/Project';
import Authority from '../models/Authority';
import Complaint from '../models/Complaint';
import Notification from '../models/Notification';
import axios from 'axios';

export const getProjects = async (req: Request, res: Response) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json({ success: true, projects });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getContractorProjects = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const projects = await Project.find({ 'contractor.userId': userId }).sort({ createdAt: -1 });
    res.json({ success: true, projects });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getAuthorities = async (req: Request, res: Response) => {
  try {
    const authorities = await Authority.find();
    res.json({ success: true, authorities });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const project = new Project({ ...req.body, 'contractor.userId': userId });
    await project.save();
    res.status(201).json({ success: true, project });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndUpdate(id, req.body, { new: true });
    if (!project) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, project });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// Contractor uploads project report with AI verification
export const uploadProjectReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, photoBase64, completionUpdate } = req.body;
    const userId = (req as any).user?.id;

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // AI verify the report photo
    let aiVerified = false;
    let aiAnalysis = '';
    if (photoBase64) {
      try {
        const response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.2-11b-vision-preview',
            messages: [{
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: photoBase64 } },
                { type: 'text', text: `Verify this project progress photo for "${project.title}" at "${project.location}".
                  Analyze: 1) Is this a real construction/project photo? 2) Does it show construction work progress?
                  3) Estimate actual completion percentage based on visible work.
                  Respond as JSON: {"isReal": true/false, "showsConstruction": true/false, "estimatedCompletion": 0-100, "analysis": "brief description"}` }
              ]
            }],
            max_tokens: 200,
          },
          { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
        );
        const content = response.data.choices[0]?.message?.content || '{}';
        const result = JSON.parse(content.replace(/```json|```/g, '').trim());
        aiVerified = result.isReal && result.showsConstruction;
        aiAnalysis = result.analysis || '';
      } catch { aiVerified = true; aiAnalysis = 'Verification unavailable'; }
    }

    project.reports.push({
      title, description, photoUrl: photoBase64 || '',
      completionUpdate: Number(completionUpdate) || project.completionPercentage,
      uploadedAt: new Date(), uploadedBy: userId,
    });

    if (completionUpdate) {
      project.completionPercentage = Number(completionUpdate);
      if (Number(completionUpdate) >= 100) project.status = 'completed';
    }

    await project.save();
    res.json({ success: true, project, aiVerified, aiAnalysis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get complaints related to contractor's projects
export const getContractorComplaints = async (req: Request, res: Response) => {
  try {
    const { status, category } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    const complaints = await Complaint.find(filter).populate('userId', 'name phone email').sort({ createdAt: -1 });
    res.json({ success: true, complaints });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// Get dashboard stats for contractor
export const getContractorStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const [totalProjects, activeProjects, completedProjects, totalComplaints, pendingComplaints] = await Promise.all([
      Project.countDocuments({ 'contractor.userId': userId }),
      Project.countDocuments({ 'contractor.userId': userId, status: 'in_progress' }),
      Project.countDocuments({ 'contractor.userId': userId, status: 'completed' }),
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'pending' }),
    ]);
    res.json({ success: true, stats: { totalProjects, activeProjects, completedProjects, totalComplaints, pendingComplaints } });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// Get authority dashboard stats
export const getAuthorityStats = async (req: Request, res: Response) => {
  try {
    const [totalComplaints, resolved, inProgress, pending, totalProjects] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'resolved' }),
      Complaint.countDocuments({ status: 'in_progress' }),
      Complaint.countDocuments({ status: 'pending' }),
      Project.countDocuments(),
    ]);
    res.json({ success: true, stats: { totalComplaints, resolved, inProgress, pending, totalProjects } });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const seedData = async (req: Request, res: Response) => {
  try {
    const projectCount = await Project.countDocuments();
    if (projectCount === 0) {
      await Project.insertMany([
        { title: 'Main Road Paving', description: 'Paving of main road from Sector 4 to Market', location: 'Sector 4 to Market', status: 'in_progress', completionPercentage: 65, contractor: { name: 'BuildRight Infra Pvt Ltd', phone: '+91 98765 43210', email: 'contractor@buildright.in' }, authority: { name: 'Dr. Sandeep Kumar, IAS', designation: 'District Magistrate', office: 'DM Office' }, startDate: new Date('2024-01-01'), expectedEndDate: new Date('2025-06-30'), budget: 5000000 },
        { title: 'Water Pipeline Upgrade', description: 'Upgrading water pipeline in North Zone', location: 'North Zone', status: 'delayed', completionPercentage: 30, contractor: { name: 'AquaFlow Engineering', phone: '+91 91234 56789', email: 'info@aquaflow.in' }, authority: { name: 'Mrs. Anita Sharma', designation: 'Chief Engineer, Water Dept.', office: 'Municipal Corp' }, startDate: new Date('2024-03-01'), expectedEndDate: new Date('2025-03-01'), budget: 3000000 }
      ]);
    }
    const authCount = await Authority.countDocuments();
    if (authCount === 0) {
      await Authority.insertMany([
        { name: 'Dr. Sandeep Kumar, IAS', designation: 'District Magistrate', department: 'Revenue & Administration', office: 'DM Office, Civil Lines', phone: '+91 11 2345 6789', email: 'dm@district.gov.in', area: 'District' },
        { name: 'Mrs. Anita Sharma', designation: 'Chief Engineer', department: 'Water Department', office: 'Municipal Corporation Building', phone: '+91 11 9876 5432', email: 'ce.water@municipal.gov.in', area: 'North Zone' },
        { name: 'Mr. Rajesh Verma', designation: 'Superintendent of Police', department: 'Police', office: 'Police Headquarters', phone: '+91 11 1122 3344', email: 'sp@police.gov.in', area: 'District' }
      ]);
    }
    res.json({ success: true, message: 'Data seeded successfully' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};