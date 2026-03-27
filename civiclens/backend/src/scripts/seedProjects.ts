// backend/src/scripts/seedProjects.ts
// Run: npx ts-node src/scripts/seedProjects.ts

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const ProjectSchema = new mongoose.Schema({
  title: String, description: String, location: String,
  status: { type: String, default: 'upcoming' },
  completionPercentage: { type: Number, default: 0 },
  budget: Number, startDate: Date, expectedEndDate: Date,
  coordinates: { lat: Number, lng: Number },
  contractor: { name: String, phone: String, email: String },
  authority: { name: String, designation: String, office: String },
  beforePhoto: { type: String, default: '' },
  afterPhoto: { type: String, default: '' },
  reports: [{ title: String, description: String, completionUpdate: Number, uploadedAt: Date, uploadedBy: mongoose.Types.ObjectId }],
}, { timestamps: true });

const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);

const projects = [
  {
    title: "NH-9 Hisar Bypass Road Widening",
    description: "4-lane widening of National Highway 9 from Hisar bypass to Hansi road junction. Includes drainage, streetlights and dividers.",
    location: "NH-9 Hisar Bypass, Hisar Urban",
    status: "in_progress", completionPercentage: 62, budget: 18500000,
    beforePhoto: '', afterPhoto: '',
    startDate: new Date("2024-04-01"), expectedEndDate: new Date("2025-06-30"),
    coordinates: { lat: 29.1624, lng: 75.7221 },
    contractor: { name: "Rajesh Infrastructure Pvt Ltd", phone: "9812345678", email: "rajesh.infra@gmail.com" },
    authority: { name: "Sh. Suresh Sharma", designation: "Executive Engineer PWD", office: "PWD Division Office, Hisar" },
    reports: [{ title: "Month 6 Progress", description: "Asphalt paving completed for 7 km. Dividers installation started.", completionUpdate: 62, uploadedAt: new Date("2024-10-10") }]
  },
  {
    title: "Adampur Block Water Pipeline Upgrade",
    description: "Replacement of 35-year-old water supply pipeline covering 18 villages in Adampur block. New 200mm HDPE pipes with 24x7 supply.",
    location: "Adampur Block, Hisar",
    status: "in_progress", completionPercentage: 45, budget: 9200000,
    beforePhoto: '', afterPhoto: '',
    startDate: new Date("2024-06-15"), expectedEndDate: new Date("2025-03-31"),
    coordinates: { lat: 29.1492, lng: 75.7217 },
    contractor: { name: "Apex Buildcon Pvt Ltd", phone: "9876543210", email: "apex.buildcon@gmail.com" },
    authority: { name: "Sh. Anil Verma", designation: "Chief Engineer Water", office: "PHED Office, Hisar" },
    reports: [{ title: "Trench Excavation Complete", description: "Pipe laying started for 12 km main line.", completionUpdate: 45, uploadedAt: new Date("2024-09-20") }]
  },
  {
    title: "Hisar Smart City Solar Street Lights",
    description: "Installation of 2,400 solar LED street lights across Hisar urban wards 1-20 with smart sensor dimming.",
    location: "Hisar Urban Wards 1-20",
    status: "completed", completionPercentage: 100, budget: 7800000,
    beforePhoto: '', afterPhoto: '',
    startDate: new Date("2023-10-01"), expectedEndDate: new Date("2024-03-31"),
    coordinates: { lat: 29.1541, lng: 75.7310 },
    contractor: { name: "SunPower Solutions Hisar", phone: "9654321098", email: "sunpower.hisar@gmail.com" },
    authority: { name: "Sh. Rajesh Kumar", designation: "Municipal Commissioner", office: "Municipal Corporation Hisar" },
    reports: [{ title: "Final Completion Report", description: "All 2,400 solar lights installed. 3,200 citizens benefited.", completionUpdate: 100, uploadedAt: new Date("2024-04-02") }]
  },
  {
    title: "Barwala-Hisar Rural Road Construction",
    description: "22 km concrete road connecting Barwala block villages to Hisar city. Covers Sandila, Dhansu, Ghangala, Balsamand.",
    location: "Barwala Block, Hisar",
    status: "in_progress", completionPercentage: 30, budget: 24000000,
    beforePhoto: '', afterPhoto: '',
    startDate: new Date("2024-09-01"), expectedEndDate: new Date("2025-12-31"),
    coordinates: { lat: 29.1050, lng: 75.6890 },
    contractor: { name: "Haryana Roads Construction Co.", phone: "9711234567", email: "hrcc.hisar@gmail.com" },
    authority: { name: "Sh. Deepak Arora", designation: "BDO Barwala", office: "Block Development Office, Barwala" },
    reports: [{ title: "Foundation Work", description: "Sub-grade preparation done for 6 km stretch.", completionUpdate: 30, uploadedAt: new Date("2024-11-15") }]
  },
  {
    title: "Hansi Primary School Building Renovation",
    description: "Renovation of 12 primary schools with new classrooms, toilets, drinking water and boundary walls.",
    location: "Hansi Block, Hisar",
    status: "completed", completionPercentage: 100, budget: 5600000,
    beforePhoto: '', afterPhoto: '',
    startDate: new Date("2023-08-01"), expectedEndDate: new Date("2024-01-31"),
    coordinates: { lat: 29.0956, lng: 75.9590 },
    contractor: { name: "Civil Works Haryana", phone: "9988776655", email: "civilworks.haryana@gmail.com" },
    authority: { name: "Smt. Kavita Singh", designation: "SDM Hansi", office: "Sub-Divisional Magistrate Office, Hansi" },
    reports: [{ title: "Project Completion", description: "12 schools done. 3,200 students benefited.", completionUpdate: 100, uploadedAt: new Date("2024-02-10") }]
  },
  {
    title: "Uklana Drainage & Flood Control",
    description: "4.8 km main drainage channel in Uklana Mandi to prevent seasonal flooding. Includes 3 retention ponds.",
    location: "Uklana Block, Hisar",
    status: "in_progress", completionPercentage: 55, budget: 11200000,
    beforePhoto: '', afterPhoto: '',
    startDate: new Date("2024-03-01"), expectedEndDate: new Date("2025-02-28"),
    coordinates: { lat: 29.4200, lng: 75.8350 },
    contractor: { name: "Flood Control Engineers Ltd", phone: "9843210987", email: "fce.hisar@gmail.com" },
    authority: { name: "Sh. Mahesh Yadav", designation: "BDO Uklana", office: "Block Development Office, Uklana" },
    reports: [{ title: "Channel Progress", description: "2.6 km lined. Retention pond 1 complete. Monsoon test passed.", completionUpdate: 55, uploadedAt: new Date("2024-08-30") }]
  },
  {
    title: "Narnaund Community Health Centre",
    description: "New 30-bed CHC at Narnaund with OPD, operation theatre, maternity ward and pathology lab.",
    location: "Narnaund Block, Hisar",
    status: "in_progress", completionPercentage: 78, budget: 32000000,
    beforePhoto: '', afterPhoto: '',
    startDate: new Date("2023-12-01"), expectedEndDate: new Date("2025-05-31"),
    coordinates: { lat: 29.2890, lng: 75.9780 },
    contractor: { name: "Medicon Builders Pvt Ltd", phone: "9765432109", email: "medicon.builders@gmail.com" },
    authority: { name: "Sh. Harish Goyal", designation: "BDO Narnaund", office: "Block Development Office, Narnaund" },
    reports: [{ title: "Structure Complete", description: "Main building done. Electrical & plumbing ongoing.", completionUpdate: 78, uploadedAt: new Date("2024-10-25") }]
  },
  {
    title: "Agroha Heritage Site Development",
    description: "Tourist infrastructure at Agroha Dham — parking, cafeteria, visitor centre and 2 km approach road.",
    location: "Agroha, Hisar",
    status: "upcoming", completionPercentage: 5, budget: 8900000,
    beforePhoto: '', afterPhoto: '',
    startDate: new Date("2025-01-15"), expectedEndDate: new Date("2025-10-31"),
    coordinates: { lat: 29.3580, lng: 75.5430 },
    contractor: { name: "Tourism Infrastructure Co.", phone: "9654320987", email: "tic.hisar@gmail.com" },
    authority: { name: "Sh. Vinod Kumar", designation: "BDO Agroha", office: "Block Development Office, Agroha" },
    reports: []
  },
  {
    title: "Hisar District Solid Waste Management Plant",
    description: "Modern solid waste processing plant, 150 TPD capacity with segregation unit, composting yard.",
    location: "Industrial Area, Hisar Rural",
    status: "delayed", completionPercentage: 20, budget: 45000000,
    beforePhoto: '', afterPhoto: '',
    startDate: new Date("2024-01-01"), expectedEndDate: new Date("2024-12-31"),
    coordinates: { lat: 29.1820, lng: 75.8120 },
    contractor: { name: "GreenWaste Solutions India", phone: "9543219876", email: "greenwaste.india@gmail.com" },
    authority: { name: "Sh. Rajesh Kumar", designation: "Municipal Commissioner", office: "Municipal Corporation Hisar" },
    reports: [{ title: "Delay Notice", description: "Land dispute resolved. Restarting construction Jan 2025.", completionUpdate: 20, uploadedAt: new Date("2024-12-01") }]
  },
  {
    title: "Bass-Litani Rural Electrification",
    description: "Electrification of 14 hamlets in Bass and Litani blocks. 2,100 household connections.",
    location: "Bass & Litani Blocks, Hisar",
    status: "completed", completionPercentage: 100, budget: 6700000,
    beforePhoto: '', afterPhoto: '',
    startDate: new Date("2023-06-01"), expectedEndDate: new Date("2023-12-31"),
    coordinates: { lat: 29.5120, lng: 75.6540 },
    contractor: { name: "Haryana Electrification Corp", phone: "9432108765", email: "hec.hisar@gmail.com" },
    authority: { name: "Sh. Pawan Gupta", designation: "BDO Litani", office: "Block Development Office, Litani" },
    reports: [{ title: "Completion Certificate", description: "All 2,100 households electrified. 18-hour daily supply.", completionUpdate: 100, uploadedAt: new Date("2024-01-05") }]
  }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/civiclens');
  console.log('Connected to MongoDB');
  await Project.deleteMany({});
  const result = await Project.insertMany(projects as any[]);
  console.log(`✅ Seeded ${result.length} projects for Hisar District`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });