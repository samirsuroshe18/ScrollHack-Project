// Fills the database with demo accounts, posts and a conversation.
// Only accounts under DEMO_DOMAIN are ever removed, so it is safe to run again.
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../database/database.js';
import { User } from '../models/user.model.js';
import { Post } from '../models/post.model.js';
import { Mentorship } from '../models/mentorship.model.js';
import { Message } from '../models/message.model.js';

const DEMO_DOMAIN = '@alumninest.demo';
const DEMO_PASSWORD = 'Demo@123';

const alumni = [
    {
        userName: 'Asha Kulkarni', email: `asha.alumni${DEMO_DOMAIN}`, state: 'Maharashtra', district: 'Pune',
        profile: {
            profession: 'Senior Frontend Engineer', field: 'Computer Engineering', passingYear: 2017, workplace: 'Persistent Systems',
            skills: ['React', 'JavaScript', 'TypeScript', 'UI Design'], location: 'Pune', availability: 'Weekends, 10 am to 1 pm',
            bio: 'I build web interfaces and enjoy helping students prepare for their first frontend role.',
        },
    },
    {
        userName: 'Rahul Deshmukh', email: `rahul.alumni${DEMO_DOMAIN}`, state: 'Karnataka', district: 'Bengaluru Urban',
        profile: {
            profession: 'Backend Developer', field: 'Information Technology', passingYear: 2015, workplace: 'Flipkart',
            skills: ['Node.js', 'MongoDB', 'System Design', 'AWS'], location: 'Bengaluru', availability: 'Weekday evenings',
            bio: 'Backend engineer working on order systems. Happy to talk about APIs, databases and interviews.',
        },
    },
    {
        userName: 'Meera Iyer', email: `meera.alumni${DEMO_DOMAIN}`, state: 'Tamil Nadu', district: 'Chennai',
        profile: {
            profession: 'Data Scientist', field: 'Data Science', passingYear: 2018, workplace: 'Zoho',
            skills: ['Python', 'Machine Learning', 'SQL', 'Statistics'], location: 'Chennai', availability: 'Saturday mornings',
            bio: 'I moved from electronics into data science and can share how to make that switch.',
        },
    },
    {
        userName: 'Vikram Singh', email: `vikram.alumni${DEMO_DOMAIN}`, state: 'Maharashtra', district: 'Mumbai',
        profile: {
            profession: 'Product Manager', field: 'Mechanical Engineering', passingYear: 2012, workplace: 'Razorpay',
            skills: ['Product Strategy', 'Analytics', 'Communication'], location: 'Mumbai', availability: 'Sunday afternoons',
            bio: 'Engineer turned product manager. Ask me about product roles and MBA decisions.',
        },
    },
    {
        userName: 'Neha Joshi', email: `neha.alumni${DEMO_DOMAIN}`, state: 'Telangana', district: 'Hyderabad',
        profile: {
            profession: 'Android Developer', field: 'Computer Science', passingYear: 2019, workplace: 'Swiggy',
            skills: ['Kotlin', 'Flutter', 'Android', 'Firebase'], location: 'Hyderabad', availability: 'Weekends',
            bio: 'Mobile developer shipping apps used by millions. I mentor on Android and Flutter.',
        },
    },
];

const students = [
    {
        userName: 'Arjun Patil', email: `arjun.student${DEMO_DOMAIN}`, state: 'Maharashtra', district: 'Pune',
        profile: { field: 'Computer Engineering', skills: ['React', 'JavaScript'], location: 'Pune', bio: 'Third-year student looking for a frontend internship.' },
    },
    {
        userName: 'Priya Nair', email: `priya.student${DEMO_DOMAIN}`, state: 'Kerala', district: 'Kochi',
        profile: { field: 'Information Technology', skills: ['Python', 'SQL'], location: 'Kochi', bio: 'Final-year student interested in data roles.' },
    },
    {
        userName: 'Kabir Shah', email: `kabir.student${DEMO_DOMAIN}`, state: 'Gujarat', district: 'Ahmedabad',
        profile: { field: 'Electronics', skills: ['Android', 'Kotlin'], location: 'Ahmedabad', bio: 'Second-year student building my first mobile app.' },
    },
];

const removeDemoData = async () => {
    const demoUsers = await User.find({ email: { $regex: `${DEMO_DOMAIN.replace('.', '\\.')}$` } }).select('_id');
    const ids = demoUsers.map((user) => user._id);
    const mentorships = await Mentorship.find({ $or: [{ student: { $in: ids } }, { mentor: { $in: ids } }] }).select('_id');

    await Message.deleteMany({ mentorship: { $in: mentorships.map((mentorship) => mentorship._id) } });
    await Mentorship.deleteMany({ _id: { $in: mentorships.map((mentorship) => mentorship._id) } });
    await Post.deleteMany({ author: { $in: ids } });
    await User.deleteMany({ _id: { $in: ids } });
};

// User.create runs the password hashing hook; insertMany would not
const createUsers = (people, role) =>
    Promise.all(people.map((person) => User.create({ ...person, role, password: DEMO_PASSWORD, isVerified: true })));

const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60 * 1000);

const seed = async () => {
    await connectDB();
    await removeDemoData();

    const [asha, rahul, meera, vikram, neha] = await createUsers(alumni, 'alumni');
    const [arjun, priya] = await createUsers(students, 'student');

    await Post.create([
        { author: asha._id, type: 'success_story', createdAt: minutesAgo(600), content: 'I failed my first three frontend interviews. What changed things was building two small projects end to end and being able to explain every decision in them. If you are preparing now, depth beats a long list of tutorials.' },
        { author: meera._id, type: 'success_story', createdAt: minutesAgo(480), content: 'I studied electronics and moved into data science two years after graduating. I spent six months on statistics and SQL before touching machine learning, and that order made all the difference.' },
        { author: vikram._id, type: 'success_story', createdAt: minutesAgo(360), content: 'I started as a design engineer and became a product manager without an MBA. I got there by volunteering for every customer call my team had and writing up what I learned.' },
        { author: rahul._id, type: 'job', createdAt: minutesAgo(240), content: 'Backend intern, Bengaluru (6 months).\nNode.js and MongoDB basics expected. You will work on internal tools with my team.\nMessage me through a mentorship request if you want a referral.' },
        { author: neha._id, type: 'job', createdAt: minutesAgo(120), content: 'Junior Android developer, Hyderabad.\nKotlin required, Flutter is a plus. Open to 2026 graduates.\nI can review your resume before you apply.' },
        { author: asha._id, type: 'job', createdAt: minutesAgo(30), content: 'Frontend developer (React), Pune, 0 to 2 years of experience.\nStrong JavaScript fundamentals matter more than the number of frameworks you know.' },
    ]);

    const accepted = await Mentorship.create({ student: arjun._id, mentor: asha._id, status: 'accepted' });
    await Mentorship.create({ student: priya._id, mentor: meera._id, status: 'pending' });

    await Message.create([
        { mentorship: accepted._id, sender: arjun._id, createdAt: minutesAgo(20), text: 'Hi Asha, thank you for accepting my request!' },
        { mentorship: accepted._id, sender: asha._id, createdAt: minutesAgo(18), text: 'Happy to help, Arjun. What are you working on right now?' },
        { mentorship: accepted._id, sender: arjun._id, createdAt: minutesAgo(15), text: 'I am building a React portfolio and preparing for internship interviews.' },
        { mentorship: accepted._id, sender: asha._id, createdAt: minutesAgo(12), text: 'Good. Send me the repository link and I will review it this weekend.' },
    ]);

    console.log('\nDemo data created.');
    console.log(`Password for every demo account: ${DEMO_PASSWORD}\n`);
    console.log('Alumni:');
    alumni.forEach((person) => console.log(`  ${person.email}`));
    console.log('Students:');
    students.forEach((person) => console.log(`  ${person.email}`));
    console.log(`\nUsers: ${await User.countDocuments({ email: { $regex: 'alumninest\\.demo$' } })}, posts: 6, mentorships: 2, messages: 4`);
};

seed()
    .then(() => mongoose.disconnect())
    .catch(async (error) => {
        console.log('Seeding failed:', error.message);
        await mongoose.disconnect();
        process.exit(1);
    });
