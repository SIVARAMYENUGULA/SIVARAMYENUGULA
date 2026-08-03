require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const env = require('../src/config/env');
const { User, Student, Company, College, Assessment, Question } = require('../src/models');

const seed = async () => {
  await mongoose.connect(env.mongodbUri);
  console.log('Connected to MongoDB');
  
  // Clear existing data
  await Promise.all([
    User.deleteMany({}), Student.deleteMany({}), Company.deleteMany({}),
    College.deleteMany({}), Assessment.deleteMany({}), Question.deleteMany({})
  ]);
  
  // Create admin
  const admin = await User.create({ name: 'Admin User', email: 'shabirsk989+admin@gmail.com', password: 'Admin@123', role: 'admin', isVerified: true });
  console.log('Admin created:', admin.email);
  
  // Create student
  const studentUser = await User.create({ name: 'Arjun Mehta', email: 'shabirsk989+student@gmail.com', password: 'Student@123', role: 'student', isVerified: true });
  const student = await Student.create({ userId: studentUser._id, course: 'B.Tech Computer Science', year: 3, profileCompleted: 85 });
  console.log('Student created:', studentUser.email);
  
  // Create company
  const companyUser = await User.create({ name: 'TechCorp HR', email: 'shabirsk989+company@gmail.com', password: 'Company@123', role: 'company', isVerified: true });
  const company = await Company.create({ userId: companyUser._id, industry: 'Technology', companySize: '1000-5000', location: 'Bangalore', verified: true });
  console.log('Company created:', companyUser.email);
  
  // Create college
  const collegeUser = await User.create({ name: 'IIT Bombay Placement', email: 'shabirsk989+college@gmail.com', password: 'College@123', role: 'college', isVerified: true });
  const college = await College.create({ userId: collegeUser._id, collegeName: 'Indian Institute of Technology, Bombay', emailDomains: ['iitb.ac.in', 'college.edu'], totalStudents: 8500, placementRate: 92.5, verified: true });
  console.log('College created:', collegeUser.email);
  
  // Create sample assessments
  const assess1 = await Assessment.create({ title: 'Full Stack Development', type: 'Technical', duration: 120, passingScore: 60, isActive: true });
  const assess2 = await Assessment.create({ title: 'Aptitude Test', type: 'Aptitude', duration: 60, passingScore: 60, isActive: true });
  
  // Questions for Assessment 1
  await Question.insertMany([
    { assessmentId: assess1._id, questionText: 'Which of the following is a key feature of React?', options: ['Two-way data binding', 'Virtual DOM', 'Direct DOM manipulation', 'Server-side rendering only'], correctIndex: 1, points: 10, orderIndex: 1 },
    { assessmentId: assess1._id, questionText: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'], correctIndex: 1, points: 10, orderIndex: 2 },
    { assessmentId: assess1._id, questionText: 'Which hook is used for side effects in React?', options: ['useState', 'useEffect', 'useContext', 'useReducer'], correctIndex: 1, points: 10, orderIndex: 3 },
    { assessmentId: assess1._id, questionText: 'What does REST stand for?', options: ['Representational State Transfer', 'Remote State Transfer', 'Representational Server Transfer', 'Remote Server Transaction'], correctIndex: 0, points: 10, orderIndex: 4 },
    { assessmentId: assess1._id, questionText: 'Which of the following is a NoSQL database?', options: ['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite'], correctIndex: 2, points: 10, orderIndex: 5 },
  ]);
  
  // Questions for Assessment 2
  await Question.insertMany([
    { assessmentId: assess2._id, questionText: 'If a train travels 60 km in 1 hour, how far will it travel in 45 minutes?', options: ['40 km', '45 km', '50 km', '55 km'], correctIndex: 1, points: 10, orderIndex: 1 },
    { assessmentId: assess2._id, questionText: 'What comes next in the sequence: 2, 6, 18, 54, ?', options: ['108', '162', '72', '216'], correctIndex: 1, points: 10, orderIndex: 2 },
    { assessmentId: assess2._id, questionText: 'What is 15% of 200?', options: ['20', '25', '30', '35'], correctIndex: 2, points: 10, orderIndex: 3 },
  ]);
  
  console.log('Seed data created successfully!');
  console.log('Default passwords: Admin@123, Student@123, Company@123, College@123');
  
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });