# Shared Project Context

## Project Title

SafeLink: A Graph-Based Public Safety Incident Mapping System

## Domain

Public Safety and Security

## Project Goal

Build a Neo4j-driven web application that models interconnected public safety incident data involving incidents, locations, persons, responders, evidence, and reports.

## Required Features

- CRUD operations for incidents and related entities
- Search functionality
- Dashboard and graph visualization
- JSON backup/download feature
- Optional login/logout

- Backend stack selected: Node.js with Express.
- Neo4j will be accessed using the official `neo4j-driver` package.

## Current Priority

Implement CRUD operations for the core nodes (Incident, Location, etc.).

## Status

- [x] Node/Express backend initialization
- [x] Neo4j connection configuration
- [x] Basic API test route
- [x] Incident CRUD operations
- [x] Location CRUD operations
- [x] Incident-Location relationship (OCCURRED_AT)
- [x] Person CRUD operations
- [x] Person-Incident relationships (INVOLVED_IN, WITNESSED, SUSPECTED_IN)
- [x] Responder CRUD operations
- [x] Responder-Incident relationship (RESPONDED_TO)
- [x] Search functionality
- [x] Dashboard metrics
- [x] JSON backup feature (Admin-restricted)
- [x] Simple HTML/CSS/JS frontend
- [x] User Authentication (Login/Logout, JWT)
- [x] QR Code Integration for Incidents
- [x] Sample Seed Data for Demo
- [x] Project Documentation (README.md)
- [x] Incident Trends Chart (Line graph with severity filter)
- [x] Server-side Pagination for Incidents
- [x] Admin-gated Account Approval System
- [x] Enhanced Relationship Presentation (Narrative statements instead of technical chips)
- [x] CRUD operations for Evidence and Report nodes
- [x] Incident Status Locking (Close/Reopen) and constraints
- [ ] Advanced Graph visualization (e.g. D3.js or Cytoscape)


## Core Graph Model

### Nodes

- Incident
- Location
- Person
- Responder
- Evidence
- Report

### Relationships

```cypher
(:Incident)-[:OCCURRED_AT]->(:Location)
(:Person)-[:INVOLVED_IN]->(:Incident)
(:Person)-[:WITNESSED]->(:Incident)
(:Person)-[:SUSPECTED_IN]->(:Incident)
(:Responder)-[:RESPONDED_TO]->(:Incident)
(:Evidence)-[:FOUND_AT]->(:Location)
(:Evidence)-[:RELATED_TO]->(:Incident)
(:Report)-[:DOCUMENTS]->(:Incident)
(:Incident)-[:RELATED_TO]->(:Incident)
```
