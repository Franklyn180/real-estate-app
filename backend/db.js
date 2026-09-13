const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'real_estate.db');
const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');

fs.mkdirSync(dataDir, { recursive: true });

const db = new sqlite3.Database(dbPath);

function seedDatabase() {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) AS count FROM properties', (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      if (row.count > 0) {
        resolve();
        return;
      }

      const properties = [
        {
          title: 'Harbor View Villa',
          location: 'Miami, FL',
          price: 980000,
          bedrooms: 4,
          bathrooms: 3,
          area: 2800,
          type: 'Villa',
          image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
          description: 'A bright waterfront villa with open-plan living, a private pool, and panoramic ocean views.'
        },
        {
          title: 'City Heights Condo',
          location: 'New York, NY',
          price: 740000,
          bedrooms: 2,
          bathrooms: 2,
          area: 1650,
          type: 'Condo',
          image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
          description: 'A modern condo in a luxury high-rise with concierge service and skyline terraces.'
        },
        {
          title: 'Maple Grove Residence',
          location: 'Austin, TX',
          price: 610000,
          bedrooms: 3,
          bathrooms: 2,
          area: 2100,
          type: 'House',
          image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80',
          description: 'This family-friendly ranch home offers natural light, outdoor entertaining space, and a serene neighborhood setting.'
        }
      ];

      const agents = [
        {
          name: 'Alicia Morgan',
          role: 'Senior Property Consultant',
          phone: '+1 (305) 555-0141',
          email: 'alicia@realtyone.com',
          bio: 'Alicia specializes in luxury homes and investor-friendly neighborhoods.'
        },
        {
          name: 'Daniel Brooks',
          role: 'Investment Advisor',
          phone: '+1 (212) 555-0198',
          email: 'daniel@realtyone.com',
          bio: 'Daniel helps clients build high-return portfolios with strategic property acquisitions.'
        }
      ];

      db.serialize(() => {
        properties.forEach((property) => {
          db.run(
            `INSERT INTO properties (title, location, price, bedrooms, bathrooms, area, type, image, description)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [property.title, property.location, property.price, property.bedrooms, property.bathrooms, property.area, property.type, property.image, property.description]
          );
        });

        agents.forEach((agent) => {
          db.run(
            `INSERT INTO agents (name, role, phone, email, bio)
             VALUES (?, ?, ?, ?, ?)`,
            [agent.name, agent.role, agent.phone, agent.email, agent.bio]
          );
        });

        resolve();
      });
    });
  });
}

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const schema = fs.readFileSync(schemaPath, 'utf8');

    db.exec(schema, (error) => {
      if (error) {
        reject(error);
        return;
      }

      seedDatabase()
        .then(resolve)
        .catch(reject);
    });
  });
}

module.exports = { db, initializeDatabase };
