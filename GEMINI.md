# MCP Subagent Architecture

## Roles

Gemini is the main orchestrator for this project.

Gemini should coordinate work, inspect code, make implementation decisions, and call Codex through MCP when deeper architecture, algorithm, or trade-off reasoning is needed.

Codex is used as a thinker for:

- architecture review
- algorithm decisions
- debugging strategy
- code structure trade-offs
- refactoring suggestions

Gemini is used for:

- implementation
- UI and UX decisions
- code editing
- project coordination
- final integration

## Plan Files

Each AI must read and update its plan file to maintain context across sessions.

| AI     | Plan File       | Purpose                                                  |
| ------ | --------------- | -------------------------------------------------------- |
| Gemini | plans/gemini.md | Implementation progress, UI/UX decisions, component work |
| Codex  | plans/codex.md  | Architecture decisions, algorithms, trade-offs           |
| Shared | plans/shared.md | Cross-AI context, project status, coordination           |

## Workflow

### Start of Session

1. Read `plans/shared.md`.
2. Read your own plan file.
3. Review `tasks/lessons.md` for previous mistakes.
4. Identify the current project goal before editing code.

### During Work

1. Make small, clear changes.
2. Explain important decisions.
3. Update your own plan file with progress.
4. Update `plans/shared.md` when the decision affects the whole project.
5. Ask Codex through MCP when architecture or logic needs deeper review.

### End of Session

1. Summarize completed work in your own plan file.
2. Update `plans/shared.md` with current status.
3. Add any mistake or lesson learned to `tasks/lessons.md`.

## MCP Usage

Use Codex MCP for:

- reviewing large implementation plans
- comparing architecture options
- checking edge cases
- finding risks in code structure
- suggesting cleaner abstractions

Do not use Codex MCP for:

- simple syntax fixes
- small CSS changes
- obvious one-line edits
- tasks Gemini can complete directly

---

# Project-Specific Instructions

## Project Title

SafeLink: A Graph-Based Public Safety Incident Mapping System

## Class Requirement

This project is for Graph-Based Web Application Development.

The goal is to design and develop a graph database-driven web application using Neo4j. The system must model interconnected data within a chosen problem domain and demonstrate why Neo4j is useful compared to relational or other NoSQL databases.

## Chosen Domain

Public Safety and Security

## Project Context

SafeLink is a public safety incident mapping system that records and visualizes relationships between incidents, people, locations, responders, evidence, and reports.

Public safety data is naturally connected. A single incident can involve multiple people, occur at a specific location, be handled by responders, include evidence, and be documented in reports. Some incidents may also be related to other incidents. This makes Neo4j suitable because the relationships are central to the system, not just the records themselves.

## Intended Users

The intended users are:

- barangay officials
- campus security personnel
- public safety officers
- emergency response coordinators

## Core Neo4j Nodes

Use these main node labels:

- Incident
- Location
- Person
- Responder
- Evidence
- Report

## Core Neo4j Relationships

Use these relationships:

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
