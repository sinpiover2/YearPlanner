# # Year Planner
Starting it up
cd "/Users/jeff_holcomb/Library/CloudStorage/Dropbox/Jeff's Curriculum/Teaching/2026-2027/Projects/Year Planner/frontend"

npm run dev

#Elevator Pitch

Year Planner is a planning and forecasting tool that helps teachers reduce the mental overhead of teaching.

Teaching requires carrying the weight of an entire school year in your head. Teachers constantly manage today’s lessons, next week’s preparation, unit pacing, assessment timelines, school events, and end-of-year goals—all while remaining fully present for students.

Year Planner helps teachers replace uncertainty with visibility.

By making pacing, upcoming instruction, preparation needs, student progress, and future consequences visible, Year Planner helps teachers spend less time managing information and more time focusing on students and instruction.

The goal is not to tell teachers what to do.

The goal is to help teachers see around corners.

?

Goal

Year Planner helps teachers understand:

* Where they are
* Where they are headed
* How today’s decisions affect the rest of the school year

A teacher should be able to open the app at 7:00 AM and immediately know what they need to teach, prepare, and watch out for.

The planner helps answer questions such as:

* What am I teaching today?
* Is anything not ready?
* Am I on pace?
* Is today’s schedule normal?
* What comes next?
* Where are my students right now?
* Which learning goals need continued development?
* If I continue teaching at my current pace, where will I end up?
* How much buffer time remains?
* What happens if a lesson takes an extra day?
* What happens if I lose instructional time to assemblies, testing, field trips, or weather?
* What are the consequences of changing my pacing?

Year Planner supports teachers across multiple planning horizons:

* Today
* This week
* This unit
* This trimester or semester
* This year

At every horizon, the planner should help answer:

1. Where am I?
2. What comes next?
3. Am I okay?
4. What requires attention?

?

Core Design Principle

Year Planner is designed to reduce the mental overhead of teaching.

The technical problem is curriculum planning.

The human problem is carrying the weight of an entire school year in your head.

Year Planner’s job is to carry some of that weight for you.

Teaching requires managing a large amount of future-oriented information in working memory. Teachers constantly track pacing, upcoming lessons, student understanding, interventions, assessments, materials, school events, and instructional decisions.

Year Planner reduces that cognitive load by making important information visible at the moment it is needed.

The goal is not to automate teacher judgment.

The goal is to support teacher judgment.

Every feature should answer one question:

Does this reduce the mental overhead of teaching?

If the answer is yes, it belongs in Year Planner.

If the answer is no, it is probably dashboard decoration.

?

Purpose

Year Planner is a decision-support tool for teachers.

Teachers make instructional decisions every day based on their students, curriculum, and professional judgment. Year Planner is not designed to replace those decisions or tell teachers what to do.

Instead, Year Planner helps make the consequences of those decisions visible through forecasting, progress monitoring, preparation support, and scenario exploration.

The planner helps teachers see around corners. It shows how decisions made today can affect future lessons, future units, available buffer time, preparation needs, student learning, and end-of-year outcomes.

Year Planner does not make instructional decisions.

It helps teachers understand the likely consequences of those decisions so they can make informed choices while remaining fully in control of their instruction.

?

Non-Goals

Year Planner is not:

* A gradebook
* A lesson authoring tool
* A curriculum marketplace
* A curriculum replacement
* An AI that tells teachers what to teach
* An AI that makes instructional decisions
* An administrative compliance system

Teachers remain responsible for instructional decisions.

Year Planner exists to make important information visible, not to make decisions.
Year Planner exists to make important information visible, not to make decisions.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
