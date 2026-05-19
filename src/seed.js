const { getSession } = require('./config/neo4j');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const seedData = async () => {
    const session = getSession();
    console.log('Seeding demo data...');

    try {
        const now = new Date().toISOString();

        // 1. Create Locations
        const locations = [
            { id: uuidv4(), name: 'Main Gate', address: 'University Entrance', type: 'Public Space', riskLevel: 'Medium', latitude: 14.6, longitude: 121.0 },
            { id: uuidv4(), name: 'Library Plaza', address: 'Near Admin Building', type: 'Public Space', riskLevel: 'Low', latitude: 14.61, longitude: 121.01 },
            { id: uuidv4(), name: 'Parking Area B', address: 'Back of Campus', type: 'Public Space', riskLevel: 'High', latitude: 14.59, longitude: 120.99 }
        ];

        for (const loc of locations) {
            await session.run(`
                MERGE (l:Location {name: $name})
                ON CREATE SET 
                    l.id = $id,
                    l.address = $address,
                    l.type = $type,
                    l.riskLevel = $riskLevel,
                    l.latitude = $latitude,
                    l.longitude = $longitude,
                    l.createdAt = $now,
                    l.updatedAt = $now
            `, { ...loc, now });
        }
        console.log('✓ Locations seeded');

        // 2. Create Persons
        const persons = [
            { id: uuidv4(), firstName: 'Juan', lastName: 'Dela Cruz', role: 'Witness', contactNumber: '09171234567', notes: 'Saw the bike being taken' },
            { id: uuidv4(), firstName: 'Maria', lastName: 'Santos', role: 'Student', contactNumber: '09187654321', notes: 'Victim of theft' },
            { id: uuidv4(), firstName: 'Robert', lastName: 'Tan', role: 'Suspect', contactNumber: 'N/A', notes: 'Matches description of loiterer' }
        ];

        for (const p of persons) {
            await session.run(`
                MERGE (p:Person {firstName: $firstName, lastName: $lastName})
                ON CREATE SET 
                    p.id = $id,
                    p.role = $role,
                    p.contactNumber = $contactNumber,
                    p.notes = $notes,
                    p.createdAt = $now,
                    p.updatedAt = $now
            `, { ...p, now });
        }
        console.log('✓ Persons seeded');

        // 3. Create Responders
        const responders = [
            { id: uuidv4(), name: 'Officer Garcia', agency: 'Campus Security', role: 'Lead Officer', contactNumber: '555-0101', status: 'Available' },
            { id: uuidv4(), name: 'Nurse Reyes', agency: 'Health Services', role: 'First Aid', contactNumber: '555-0202', status: 'Available' }
        ];

        for (const r of responders) {
            await session.run(`
                MERGE (r:Responder {name: $name})
                ON CREATE SET 
                    r.id = $id,
                    r.agency = $agency,
                    r.role = $role,
                    r.contactNumber = $contactNumber,
                    r.status = $status,
                    r.createdAt = $now,
                    r.updatedAt = $now
            `, { ...r, now });
        }
        console.log('✓ Responders seeded');

        // 4. Create Incidents and Relationships
        const getPastDate = (daysAgo) => {
            const d = new Date();
            d.setDate(d.getDate() - daysAgo);
            return d.toISOString();
        };

        const incidents = [
            { 
                id: uuidv4(), title: 'Bicycle Theft', type: 'Theft', description: 'Student reported stolen bike near Parking Area B', 
                status: 'Open', severity: 'Medium', date: getPastDate(6),
                location: 'Parking Area B',
                witness: { first: 'Juan', last: 'Dela Cruz' },
                victim: { first: 'Maria', last: 'Santos' },
                responder: 'Officer Garcia'
            },
            { 
                id: uuidv4(), title: 'Medical Emergency', type: 'Medical', description: 'Fainting spell in Library Plaza', 
                status: 'Closed', severity: 'Low', date: getPastDate(5),
                location: 'Library Plaza',
                responder: 'Nurse Reyes'
            },
            { 
                id: uuidv4(), title: 'Suspicious Person', type: 'Investigation', description: 'Unauthorized person loitering at Main Gate', 
                status: 'Open', severity: 'High', date: getPastDate(4),
                location: 'Main Gate',
                suspect: { first: 'Robert', last: 'Tan' },
                responder: 'Officer Garcia'
            },
            { 
                id: uuidv4(), title: 'Vandalism at Plaza', type: 'Property Damage', description: 'Graffiti found on the side of the library', 
                status: 'Open', severity: 'Low', date: getPastDate(4),
                location: 'Library Plaza',
                responder: 'Officer Garcia'
            },
            { 
                id: uuidv4(), title: 'Unauthorized Drone', type: 'Security Violation', description: 'Drone sighted over restricted parking area', 
                status: 'Closed', severity: 'Medium', date: getPastDate(3),
                location: 'Parking Area B',
                responder: 'Officer Garcia'
            },
            { 
                id: uuidv4(), title: 'Severe Altercation', type: 'Physical Altercation', description: 'Heated argument turned physical at the Main Gate', 
                status: 'Pending', severity: 'High', date: getPastDate(2),
                location: 'Main Gate',
                witness: { first: 'Juan', last: 'Dela Cruz' },
                responder: 'Officer Garcia'
            },
            { 
                id: uuidv4(), title: 'Minor Fire Alarm', type: 'Fire', description: 'Trash bin fire detected and extinguished', 
                status: 'Closed', severity: 'Medium', date: getPastDate(1),
                location: 'Library Plaza',
                responder: 'Officer Garcia'
            },
            { 
                id: uuidv4(), title: 'Package Theft', type: 'Theft', description: 'Delivery package taken from student lounge', 
                status: 'Open', severity: 'Medium', date: getPastDate(0),
                location: 'Main Gate',
                victim: { first: 'Maria', last: 'Santos' },
                responder: 'Officer Garcia'
            }
        ];

        for (const inc of incidents) {
            await session.run(`
                MERGE (i:Incident {title: $title})
                ON CREATE SET 
                    i.id = $id,
                    i.type = $type,
                    i.description = $description,
                    i.status = $status,
                    i.severity = $severity,
                    i.date = $date,
                    i.createdAt = $now,
                    i.updatedAt = $now
                WITH i
                MATCH (l:Location {name: $location})
                MERGE (i)-[:OCCURRED_AT]->(l)
            `, { ...inc, now });

            if (inc.witness) {
                await session.run(`
                    MATCH (i:Incident {title: $title}), (p:Person {firstName: $first, lastName: $last})
                    MERGE (p)-[:WITNESSED]->(i)
                `, { title: inc.title, first: inc.witness.first, last: inc.witness.last });
            }
            if (inc.victim) {
                await session.run(`
                    MATCH (i:Incident {title: $title}), (p:Person {firstName: $first, lastName: $last})
                    MERGE (p)-[:INVOLVED_IN]->(i)
                `, { title: inc.title, first: inc.victim.first, last: inc.victim.last });
            }
            if (inc.suspect) {
                await session.run(`
                    MATCH (i:Incident {title: $title}), (p:Person {firstName: $first, lastName: $last})
                    MERGE (p)-[:SUSPECTED_IN]->(i)
                `, { title: inc.title, first: inc.suspect.first, last: inc.suspect.last });
            }
            if (inc.responder) {
                await session.run(`
                    MATCH (i:Incident {title: $title}), (r:Responder {name: $responder})
                    MERGE (r)-[:RESPONDED_TO]->(i)
                `, { title: inc.title, responder: inc.responder });
            }
        }
        console.log('✓ Incidents and Relationships seeded');
        console.log('Seeding completed successfully!');

    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await session.close();
        process.exit(0);
    }
};

seedData();
