// Demo data so matches show up immediately. Run: npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Message = require('./models/Message');
const Review = require('./models/Review');

const slot = (day, start, end) => ({ day, start, end });

const people = [
  { name: 'Aarav Sharma', email: 'aarav@demo.com', bio: 'Frontend dev who wants to sing better.',
    teaches: [{ name: 'react', level: 'advanced' }, { name: 'javascript', level: 'advanced' }],
    wants: [{ name: 'guitar', level: 'beginner' }],
    availability: [slot(1, 18, 21), slot(3, 18, 21), slot(6, 10, 14)], rating: 4.8, completedSessions: 9 },
  { name: 'Priya Nair', email: 'priya@demo.com', bio: 'Guitarist learning to code.',
    teaches: [{ name: 'guitar', level: 'advanced' }, { name: 'music theory', level: 'intermediate' }],
    wants: [{ name: 'react', level: 'beginner' }],
    availability: [slot(1, 19, 22), slot(6, 11, 13)], rating: 4.6, completedSessions: 6 },
  { name: 'Rohan Mehta', email: 'rohan@demo.com', bio: 'Designer curious about Spanish.',
    teaches: [{ name: 'figma', level: 'advanced' }, { name: 'ui design', level: 'advanced' }],
    wants: [{ name: 'spanish', level: 'beginner' }, { name: 'javascript', level: 'beginner' }],
    availability: [slot(3, 17, 20), slot(0, 10, 12)], rating: 4.2, completedSessions: 3 },
  { name: 'Sofia Alvarez', email: 'sofia@demo.com', bio: 'Native Spanish speaker, wants to learn design.',
    teaches: [{ name: 'spanish', level: 'advanced' }],
    wants: [{ name: 'figma', level: 'beginner' }],
    availability: [slot(3, 18, 20), slot(0, 9, 12)], rating: 4.9, completedSessions: 12 },
  { name: 'Karan Verma', email: 'karan@demo.com', bio: 'Data nerd who wants to cook.',
    teaches: [{ name: 'python', level: 'advanced' }, { name: 'sql', level: 'intermediate' }],
    wants: [{ name: 'cooking', level: 'beginner' }],
    availability: [slot(2, 20, 22), slot(6, 9, 12)], rating: 4.0, completedSessions: 2 },
  { name: 'Meera Iyer', email: 'meera@demo.com', bio: 'Chef who wants to learn Python.',
    teaches: [{ name: 'cooking', level: 'advanced' }],
    wants: [{ name: 'python', level: 'beginner' }],
    availability: [slot(2, 20, 23), slot(6, 10, 12)], rating: 4.7, completedSessions: 8 },
  { name: 'Vishal Kumar', email: 'demo@demo.com', bio: 'Demo account — teaches Node.js, wants guitar & Spanish.',
    teaches: [{ name: 'node.js', level: 'intermediate' }, { name: 'react', level: 'intermediate' }],
    wants: [{ name: 'guitar', level: 'beginner' }, { name: 'spanish', level: 'beginner' }],
    availability: [slot(1, 18, 21), slot(6, 10, 13)], rating: 0, completedSessions: 0 },
      { name: 'Diego Ramos', email: 'diego@demo.com', bio: 'Spanish tutor who wants to learn backend development.',
    teaches: [{ name: 'spanish', level: 'advanced' }],
    wants: [{ name: 'node.js', level: 'beginner' }],
    availability: [slot(1, 18, 20), slot(6, 10, 12)], rating: 4.9, completedSessions: 14 },
  { name: 'Ananya Rao', email: 'ananya@demo.com', bio: 'Music teacher who wants to learn React and Node.',
    teaches: [{ name: 'guitar', level: 'intermediate' }, { name: 'music theory', level: 'advanced' }],
    wants: [{ name: 'react', level: 'beginner' }, { name: 'node.js', level: 'beginner' }],
    availability: [slot(1, 19, 21), slot(6, 11, 13)], rating: 4.5, completedSessions: 7 },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skillbridge');
  await Promise.all([User.deleteMany({}), Message.deleteMany({}), Review.deleteMany({})]);
  const password = await bcrypt.hash('password123', 10);
  await User.insertMany(people.map((p) => ({ ...p, password })));
  console.log(`Seeded ${people.length} users. Login with any @demo.com email / password123`);
  console.log('Try demo@demo.com  (matches Priya on guitar <-> react)');
  await mongoose.disconnect();
})();
