import { Request, Response } from 'express';
import Project from '../models/Project';
import Authority from '../models/Authority';

export const getProjects = async (req: Request, res: Response) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getAuthorities = async (req: Request, res: Response) => {
  try {
    const authorities = await Authority.find();
    res.json({ success: true, authorities });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const project = new Project(req.body);
    await project.save();
    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const seedData = async (req: Request, res: Response) => {
  try {
    // Seed projects
    const projectCount = await Project.countDocuments();
    if (projectCount === 0) {
      await Project.insertMany([
        {
          title: 'Main Road Paving',
          description: 'Paving of main road from Sector 4 to Market',
          location: 'Sector 4 to Market',
          status: 'in_progress',
          completionPercentage: 65,
          contractor: { name: 'BuildRight Infra Pvt Ltd', phone: '+91 98765 43210', email: 'contractor@example.com' },
          authority: { name: 'Dr. Sandeep Kumar, IAS', designation: 'District Magistrate', office: 'DM Office' },
          startDate: new Date('2024-01-01'),
          expectedEndDate: new Date('2025-06-30'),
          budget: 5000000,
        },
        {
          title: 'Water Pipeline Upgrade',
          description: 'Upgrading water pipeline in North Zone',
          location: 'North Zone',
          status: 'delayed',
          completionPercentage: 30,
          contractor: { name: 'AquaFlow Engineering', phone: '+91 91234 56789' },
          authority: { name: 'Mrs. Anita Sharma', designation: 'Chief Engineer, Water Dept.', office: 'Municipal Corp' },
          startDate: new Date('2024-03-01'),
          expectedEndDate: new Date('2025-03-01'),
          budget: 3000000,
        }
      ]);
    }

    // Seed authorities
    const authCount = await Authority.countDocuments();
    if (authCount === 0) {
      await Authority.insertMany([
        {
          name: 'Dr. Sandeep Kumar, IAS',
          designation: 'District Magistrate',
          department: 'Revenue & Administration',
          office: 'DM Office, Civil Lines',
          phone: '+91 11 2345 6789',
          email: 'dm@district.gov.in',
          area: 'District',
        },
        {
          name: 'Mrs. Anita Sharma',
          designation: 'Chief Engineer',
          department: 'Water Department',
          office: 'Municipal Corporation Building',
          phone: '+91 11 9876 5432',
          email: 'ce.water@muncipal.gov.in',
          area: 'North Zone',
        },
        {
          name: 'Mr. Rajesh Verma',
          designation: 'Superintendent of Police',
          department: 'Police',
          office: 'Police Headquarters',
          phone: '+91 11 1122 3344',
          email: 'sp@police.gov.in',
          area: 'District',
        }
      ]);
    }

    res.json({ success: true, message: 'Data seeded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};