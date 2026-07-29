// Human-supervised transcription of Curriculm/M1/IM1_Curriculum_Extraction.md
// into machine-readable form. Per AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md §7,
// this is a one-time transcription, not an automated Markdown parser — the
// extraction's own inconsistencies (two Type vocabularies, per-unit anomalies)
// are handled by careful re-reading, not parsing logic.
//
// Every string below was copied verbatim from the extraction document's
// Instructional Items tables. Do not "clean up," normalize, or infer values
// here — if the source document changes, re-transcribe by hand and diff
// against the previous version of this file.
//
// requiredDays/optionalDays status values are the literal categories that
// actually appear in the extraction document for these fields:
//   "value_provided"    — a real number was stated (Unit 3 only)
//   "not_provided"       — the pre-"Confirmed/Not-yet-verified" wording used
//                           only by Unit 4; left as-is, not reclassified
//   "not_yet_verified"   — the extraction's own "Not yet verified" wording
//                           (Units 1, 2, 5, 6, 7)

export const COURSE = {
  courseId: "IM1",
  courseLabel: "Integrated Math 1 (IM1)",
};

export const UNITS = [
  {
    unitNumber: 1,
    title: "Patterns and Sequences",
    purpose:
      "Students use tables, graphs, and expressions to make predictions about sequences. They determine if sequences are arithmetic, geometric, or neither. They write recursive and explicit definitions for sequences with constant differences and constant ratios and interpret parts of the definitions in context.",
    requiredDays: { status: "not_yet_verified", value: null },
    optionalDays: { status: "not_yet_verified", value: null },
    items: [
      {
        order: 1,
        type: "Meet & Greet",
        title: "Meet & Greet",
        subtitle: "Introduction to Math 1 and Each Other",
        isOptional: true,
        optionalityBasis:
          'Stated as "Note: This lesson is optional," not the usual OPTIONAL badge (Extraction Note #16).',
        summary:
          "This is intended to help you get to know your students and for them to get to know each other.",
        provenanceNote:
          "No type prefix in source; positioned first with no unit-overview mention (Extraction Note #16).",
      },
      {
        order: 2,
        type: "Pre-Unit Check",
        title: "M1.1 Pre-Unit Check",
        subtitle: null,
        isOptional: true,
        summary:
          "Learn more about your students' understanding of foundational concepts and skills that will support them in the upcoming unit.",
      },
      {
        order: 3,
        type: "Explore",
        title: "Patterns Found in Nature",
        subtitle: "Explore: Patterns Found in Nature",
        isOptional: true,
        summary: "What mathematical patterns can be seen in nature?",
      },
      {
        order: 4,
        type: "Lesson",
        title: "Visual Patterns",
        subtitle: "Lesson 1: Exploring Patterns",
        isOptional: false,
        summary: "Let's explore visual patterns.",
      },
      {
        order: 5,
        type: "Lesson",
        title: "Sequence Carnival",
        subtitle: "Lesson 2: Introduction to Sequences",
        isOptional: false,
        summary: "Let's explore sequences.",
      },
      {
        order: 6,
        type: "Lesson",
        title: "Recursion Machine",
        subtitle: "Lesson 3: Recursive Definitions",
        isOptional: false,
        summary:
          "Let's write recursive definitions of sequences to meet certain requirements.",
      },
      {
        order: 7,
        type: "Lesson",
        title: "See the Sequence",
        subtitle: "Lesson 4: Arithmetic and Geometric Sequences",
        isOptional: false,
        summary: "Let's compare sequences using tables and graphs.",
      },
      {
        order: 8,
        type: "Lesson",
        title: "Paper Patterns",
        subtitle: "Lesson 5: Explicit Expressions",
        isOptional: false,
        summary: "Let's represent situations in different ways.",
      },
      {
        order: 9,
        type: "Lesson",
        title: "More Visual Patterns",
        subtitle: "Lesson 6: The nth Term",
        isOptional: false,
        summary:
          "Let's write explicit expressions for arithmetic and geometric sequences.",
      },
      {
        order: 10,
        type: "Lesson",
        title: "Tree-Mendous Models",
        subtitle: "Lesson 7: Introduction to Modeling Situations",
        isOptional: false,
        summary:
          "Let's model proposals mathematically and consider how they might affect a community.",
      },
      {
        order: 11,
        type: "Practice Day",
        title: "M1.1 Practice Day",
        subtitle: null,
        isOptional: false,
        summary:
          "Students practice the concepts, skills, and strategies developed in this unit.",
      },
      {
        order: 12,
        type: "Performance Task",
        title: "M1.1 Performance Task",
        subtitle: null,
        isOptional: false,
        summary:
          "Assign this summative assessment performance task at the end of the unit to evaluate students' proficiency with the concepts and skills addressed in the unit.",
      },
      {
        order: 13,
        type: "Unit Synthesis and Reflection",
        title: "Unit Synthesis and Reflection",
        subtitle: null,
        isOptional: false,
        summary:
          "Six optional activities for students to engage in at the end of a unit to synthesize and/or reflect on their learning.",
      },
    ],
    flexibleItems: [],
  },

  {
    unitNumber: 2,
    title: "Solving Equations and Inequalities",
    purpose:
      "Students revisit strategies to determine the solutions to one-variable linear equations and extend their knowledge to make sense of solving multi-variable linear equations. They create equivalent equations as they solve linear equations and interpret the different types of solutions such as infinitely many solutions and no solutions in context. They connect graphs, tables, and equations to the situations they represent and interpret key features such as the x-intercept and y-intercept. Students represent the same linear equation in point-slope form, standard form, or slope-intercept form. They determine the solution set to an inequality algebraically and use technology tools to strategically find the graphical solution region to inequalities, investigating real situations and modeling their constraints using equations and inequalities.",
    requiredDays: { status: "not_yet_verified", value: null },
    optionalDays: { status: "not_yet_verified", value: null },
    items: [
      {
        order: 1,
        type: "Pre-Unit Check",
        title: "M1.2 Pre-Unit Check",
        subtitle: null,
        isOptional: true,
        summary:
          "Learn more about your students' understanding of foundational concepts and skills that will support them in the upcoming unit.",
      },
      {
        order: 2,
        type: "Explore",
        title: "Planning for Homecoming",
        subtitle: "Explore: Planning for Homecoming",
        isOptional: true,
        summary: "How can different conditions affect preparation for Homecoming?",
      },
      {
        order: 3,
        type: "Lesson",
        title: "Working Backwards",
        subtitle: "Lesson 1: Solving Equations With Inverse Operations",
        isOptional: false,
        summary: "Let's solve equations by working backwards.",
      },
      {
        order: 4,
        type: "Lesson",
        title: "Solving Strategies",
        subtitle: "Lesson 2: More Solving With One-Variable Equations",
        isOptional: false,
        summary: "Let's explore strategies for solving equations.",
      },
      {
        order: 5,
        type: "Lesson",
        title: "Same Position",
        subtitle: "Lesson 3: No Solution and Infinitely Many Solutions",
        isOptional: false,
        summary:
          "Let's explore how many solutions are possible for a one-variable equation.",
      },
      {
        order: 6,
        type: "Lesson",
        title: "Subway Seats",
        subtitle: "Lesson 4: Representing Situations With Two-Variable Equations",
        isOptional: false,
        summary:
          "Let's explore what different forms of linear equations reveal about a situation.",
      },
      {
        order: 7,
        type: "Lesson",
        title: "Various Variables",
        subtitle: "Lesson 5: Solving Multi-Variable Equations",
        isOptional: false,
        summary: "Let's rearrange equations with multiple variables.",
      },
      {
        order: 8,
        type: "Lesson",
        title: "Shelley the Snail",
        subtitle: "Lesson 6: Connecting Graphs and Linear Equations",
        isOptional: false,
        summary:
          "Let's connect graphs, tables, and equations to the situations they represent.",
      },
      {
        order: 9,
        type: "Lesson",
        title: "Equations of Lines",
        subtitle: "Lesson 7: Introducing Point-Slope Form",
        isOptional: false,
        summary:
          "Let's explore what information is needed to determine a point-slope form equation of a line.",
      },
      {
        order: 10,
        type: "Lesson",
        title: "Five Representations",
        subtitle: "Lesson 8: Linear Relationships in Equations, Tables, and Graphs",
        isOptional: false,
        summary: "Let's explore different ways to represent linear relationships.",
      },
      {
        order: 11,
        type: "Practice Day",
        title: "M1.2 Practice Day 1",
        subtitle: null,
        isOptional: false,
        summary:
          "Students practice the concepts, skills, and strategies developed in Lessons 1–8.",
        provenanceNote:
          "Source text contains a stray embedded asset URL concatenated onto this item's description; excluded from summary as a PDF-export artifact, not authored content (Extraction Note #18).",
      },
      {
        order: 12,
        type: "Sub-Unit Quiz",
        title: "M1.2 Sub-Unit Quiz",
        subtitle: null,
        isOptional: false,
        summary:
          "Learn about your students' understanding of the concepts and skills so far in this unit.",
      },
      {
        order: 13,
        type: "Lesson",
        title: "Pizza Delivery",
        subtitle: "Lesson 9: Representing Situations With One-Variable Inequalities",
        isOptional: false,
        summary: "Let's write inequalities to represent constraints.",
      },
      {
        order: 14,
        type: "Lesson",
        title: "Graphing Inequalities",
        subtitle: "Lesson 10: Inequalities on the Number Line",
        isOptional: false,
        summary: "Let's represent solutions to inequalities on a number line.",
      },
      {
        order: 15,
        type: "Lesson",
        title: "Solutions and Sheep",
        subtitle: "Lesson 11: Solving One-Variable Inequalities",
        isOptional: false,
        summary:
          "Let's make connections between solving one-variable equations and solving inequalities.",
      },
      {
        order: 16,
        type: "Lesson",
        title: "Absolute Value Solutions",
        subtitle: "Lesson 12: Solving Absolute Value Equations and Inequalities",
        isOptional: false,
        summary: "Let's solve absolute value equations and inequalities.",
      },
      {
        order: 17,
        type: "Lesson",
        title: "All Sorts of Screws",
        subtitle:
          "Lesson 13: Creating and Solving Absolute Value Equations and Inequalities",
        isOptional: false,
        summary: "Let's create and solve absolute value equations and inequalities.",
      },
      {
        order: 18,
        type: "Lesson",
        title: "Bracelet Budgets",
        subtitle: "Lesson 14: Introduction to Two-Variable Inequalities",
        isOptional: false,
        summary:
          "Let's explore solutions to two-variable inequalities graphically and symbolically.",
      },
      {
        order: 19,
        type: "Lesson",
        title: "All of the Solutions",
        subtitle: "Lesson 15: Graphing Solutions to Two-Variable Inequalities",
        isOptional: false,
        summary:
          "Let's represent all of the solutions to two-variable inequalities graphically.",
      },
      {
        order: 20,
        type: "Lesson",
        title: "Charity Concerts",
        subtitle: "Lesson 16: Graphing Two-Variable Inequalities in Context",
        isOptional: false,
        summary:
          "Let's represent constraints by graphing two-variable inequalities in context.",
      },
      {
        order: 21,
        type: "Lesson",
        title: "Water Way",
        subtitle: "Lesson 17: Using Two-Variable Inequalities to Make Decisions",
        isOptional: false,
        summary: "Let's use two-variable inequalities to make decisions.",
      },
      {
        order: 22,
        type: "Practice Day",
        title: "M1.2 Practice Day 2",
        subtitle: null,
        isOptional: false,
        summary:
          "Students practice the concepts, skills, and strategies developed in Lessons 1–17.",
      },
      {
        order: 23,
        type: "Performance Task",
        title: "M1.2 Performance Task",
        subtitle: null,
        isOptional: false,
        summary:
          "Assign this summative assessment performance task at the end of the unit to evaluate students' proficiency with the concepts and skills addressed in the unit.",
      },
      {
        order: 24,
        type: "Unit Synthesis and Reflection",
        title: "Unit Synthesis and Reflection",
        subtitle: null,
        isOptional: false,
        summary:
          "Six optional activities for students to engage in at the end of a unit to synthesize and/or reflect on their learning.",
      },
    ],
    flexibleItems: [],
  },

  {
    unitNumber: 3,
    title: "Systems of Linear Equations and Inequalities",
    purpose:
      "Students solve systems of linear equations and inequalities, using elimination, substitution, and graphing. They graph systems of linear inequalities and identify solutions, and they write systems of linear equations and inequalities to represent real situations and interpret solutions in context. Students also prove the slope criteria for parallel and perpendicular lines and derive the distance formula, using coordinates, equations, and formulas to solve problems — including determining the perimeter and area of polygons.",
    requiredDays: { status: "value_provided", value: 17 },
    optionalDays: { status: "value_provided", value: 3 },
    items: [
      {
        order: 1,
        type: "Pre-Unit Check",
        title: "M1.3 Pre-Unit Check",
        subtitle: null,
        isOptional: true,
        summary:
          "Learn more about your students' understanding of foundational concepts and skills that will support them in the upcoming unit.",
      },
      {
        order: 2,
        type: "Explore",
        title: "A Community Fundraiser",
        subtitle: "Explore: A Community Fundraiser",
        isOptional: true,
        summary: "How do different constraints affect profit?",
      },
      {
        order: 3,
        type: "Lesson",
        title: "Shape It Up",
        subtitle: "Lesson 1: Introduction to Systems of Equations",
        isOptional: true,
        summary: "Let's use reasoning to solve shape puzzles.",
      },
      {
        order: 4,
        type: "Lesson",
        title: "Eliminating Shapes",
        subtitle: "Lesson 2: Introduction to Elimination",
        isOptional: false,
        summary:
          "Let's solve systems of equations by adding or subtracting the equations to eliminate a variable.",
      },
      {
        order: 5,
        type: "Lesson",
        title: "Process of Elimination",
        subtitle: "Lesson 3: Elimination Using Equivalent Equations",
        isOptional: false,
        summary: "Let's create equivalent equations to eliminate a variable.",
      },
      {
        order: 6,
        type: "Lesson",
        title: "Solution by Substitution",
        subtitle: "Lesson 4: Solving Systems by Substitution",
        isOptional: false,
        summary: "Let's use substitution to solve systems of equations.",
      },
      {
        order: 7,
        type: "Lesson",
        title: "Lizard Lines",
        subtitle: "Lesson 5: Graphing Systems of Linear Equations",
        isOptional: false,
        summary: "Let's explore systems of equations using graphs.",
      },
      {
        order: 8,
        type: "Lesson",
        title: "City Development",
        subtitle: "Lesson 6: Solving Graphically and Symbolically",
        isOptional: false,
        summary:
          "Let's solve systems of equations using multiple methods and interpret solutions in context.",
      },
      {
        order: 9,
        type: "Lesson",
        title: "Bus Systems",
        subtitle: "Lesson 7: Writing and Solving Systems of Equations",
        isOptional: false,
        summary: "Let's model real-world situations using systems of equations.",
      },
      {
        order: 10,
        type: "Lesson",
        title: "Electric Line Zapper",
        subtitle: "Lesson 8: Strategically Solving Systems of Linear Equations",
        isOptional: false,
        summary: "Let's solve systems of equations strategically.",
      },
      {
        order: 11,
        type: "Practice",
        title: "M1.3 Practice Day 1",
        subtitle: null,
        isOptional: false,
        summary:
          "Students practice the concepts, skills, and strategies developed in Lessons 1–8.",
      },
      {
        order: 12,
        type: "Lesson",
        title: "Quilts",
        subtitle: "Lesson 9: Introduction to Systems of Inequalities",
        isOptional: false,
        summary: "Let's explore what solutions to a system of inequalities mean.",
      },
      {
        order: 13,
        type: "Lesson",
        title: "Seeking Solutions",
        subtitle: "Lesson 10: Solutions to Systems of Inequalities",
        isOptional: false,
        summary:
          "Let's explore strategies for determining the solution region for a system of inequalities.",
      },
      {
        order: 14,
        type: "Lesson",
        title: "Boundaries and Shading",
        subtitle: "Lesson 11: Graphing Systems of Inequalities",
        isOptional: false,
        summary: "Let's write and graph systems of inequalities.",
      },
      {
        order: 15,
        type: "Lesson",
        title: "Community Meals",
        subtitle: "Lesson 12: Using Systems of Inequalities to Make Decisions",
        isOptional: false,
        summary:
          "Let's use systems of inequalities to model real-world situations.",
      },
      {
        order: 16,
        type: "Practice",
        title: "M1.3 Practice Day 2",
        subtitle: null,
        isOptional: false,
        summary:
          "Students practice the concepts, skills, and strategies developed in Lessons 1–12.",
      },
      {
        order: 17,
        type: "Mid-Unit Check",
        title: "M1.3 Sub-Unit Quiz",
        subtitle: null,
        isOptional: false,
        summary:
          "Learn about your students' understanding of the concepts and skills so far in this unit.",
        provenanceNote:
          'Title preserves the source\'s own "Sub-Unit Quiz" wording; Type is the teacher-confirmed normalized value "Mid-Unit Check" (Extraction Note #5) — not the unit\'s summative assessment.',
      },
      {
        order: 18,
        type: "Lesson",
        title: "Parallel Lines on the Coordinate Grid",
        subtitle: "Lesson 13: Proving Slope Criteria for Parallel Lines",
        isOptional: false,
        summary: "Let's use coordinates to investigate parallel lines.",
      },
      {
        order: 19,
        type: "Lesson",
        title: "Perpendicular Lines on the Coordinate Grid",
        subtitle: "Lesson 14: Proving Slope Criteria for Perpendicular Lines",
        isOptional: false,
        summary: "Let's investigate the slopes of perpendicular lines.",
      },
      {
        order: 20,
        type: "Lesson",
        title: "It's All on the Line",
        subtitle: "Lesson 15: Determining Equations of Lines",
        isOptional: false,
        summary: "Let's work with both parallel and perpendicular lines.",
      },
      {
        order: 21,
        type: "Lesson",
        title: "Going the Distance",
        subtitle: "Lesson 16: Using Coordinates to Find Length",
        isOptional: false,
        summary:
          "Let's explore another way to find the length of the segment that connects two points.",
      },
      {
        order: 22,
        type: "Lesson",
        title: "Restaurant Math",
        subtitle: "Lesson 17: Determining Perimeter and Area on the Coordinate Grid",
        isOptional: false,
        summary: "Let's explore the perimeter and area using coordinates.",
      },
      {
        order: 23,
        type: "Practice",
        title: "M1.3 Practice Day 3",
        subtitle: null,
        isOptional: false,
        summary:
          "Students practice the concepts, skills, and strategies developed in Lessons 1–17.",
      },
      {
        order: 24,
        type: "Assessment",
        title: "M1.3 Performance Task",
        subtitle: null,
        isOptional: false,
        summary:
          "Assign this summative assessment performance task at the end of the unit to evaluate students' proficiency with the concepts and skills addressed in the unit.",
      },
      {
        order: 25,
        type: "Reflection",
        title: "Unit Synthesis and Reflection",
        subtitle: null,
        isOptional: false,
        summary:
          "Six optional activities for students to engage in at the end of a unit to synthesize and/or reflect on their learning.",
      },
    ],
    flexibleItems: [],
  },

  {
    unitNumber: 4,
    title: "Describing Functions",
    purpose:
      "Students determine whether a relationship is a function and interpret statements in function notation. They compare functions using function notation and make connections between a function's multiple representations (graphs, tables, equations, and situations). They describe functions using their key features, including average rate of change, domain, and range. They interpret, evaluate, graph, and write equations of absolute value functions. They analyze and represent sequences using function notation.",
    requiredDays: { status: "not_provided", value: null },
    optionalDays: { status: "not_provided", value: null },
    items: [
      {
        order: 1,
        type: "Pre-Unit Check",
        title: "M1.4 Pre-Unit Check",
        subtitle: null,
        isOptional: true,
        summary:
          "Learn more about your students' understanding of foundational concepts and skills that will support them in the upcoming unit.",
      },
      {
        order: 2,
        type: "Explore",
        title: "School Commutes",
        subtitle: "Explore: School Commutes",
        isOptional: true,
        summary: "How can a graph represent a situation?",
      },
      {
        order: 3,
        type: "Lesson",
        title: "Mystery Rule",
        subtitle: "Lesson 1: What Is a Function?",
        isOptional: false,
        summary: "Let's consider whether or not rules are functions.",
      },
      {
        order: 4,
        type: "Lesson",
        title: "Pricing Pizzas",
        subtitle: "Lesson 2: Introducing Function Notation",
        isOptional: false,
        summary:
          "Let's learn what function notation is and interpret function notation statements in context.",
      },
      {
        order: 5,
        type: "Lesson",
        title: "Toy Factory",
        subtitle: "Lesson 3: Function Notation and Equations",
        isOptional: false,
        summary:
          "Let's explore functions represented as equations written in function notation.",
      },
      {
        order: 6,
        type: "Lesson",
        title: "Function Carnival",
        subtitle: "Lesson 4: Creating and Interpreting Graphs of Functions",
        isOptional: false,
        summary: "Let's create and analyze graphs that represent stories.",
      },
      {
        order: 7,
        type: "Lesson",
        title: "Craft-a-Graph",
        subtitle: "Lesson 5: Key Features of Graphs",
        isOptional: false,
        summary:
          "Let's describe and create graphs of functions using key features.",
      },
      {
        order: 8,
        type: "Lesson",
        title: "Plane, Train, and Automobile",
        subtitle: "Lesson 6: Average Rate of Change",
        isOptional: false,
        summary: "Let's calculate the rate of change over a specified interval.",
      },
      {
        order: 9,
        type: "Lesson",
        title: "Space Race",
        subtitle: "Lesson 7: Comparing Graphs",
        isOptional: false,
        summary:
          "Let's make connections between function notation and key features of graphs.",
      },
      {
        order: 10,
        type: "Lesson",
        title: "Ins and Outs",
        subtitle: "Lesson 8: Introducing Domain and Range",
        isOptional: false,
        summary: "Let's explore the possible inputs and outputs of functions.",
      },
      {
        order: 11,
        type: "Lesson",
        title: "Elevator Stories",
        subtitle: "Lesson 9: Describing Domain and Range With Inequalities",
        isOptional: false,
        summary:
          "Let's use compound inequalities to describe the domain and range of functions from their graphs.",
      },
      {
        order: 12,
        type: "Lesson",
        title: "Marbleslides",
        subtitle: "Lesson 10: Graphing Functions With Restrictions",
        isOptional: false,
        summary: "Let's practice restricting the domain and range of a graph.",
      },
      {
        order: 13,
        type: "Practice",
        title: "M1.4 Practice Day 1",
        subtitle: null,
        isOptional: false,
        summary:
          "Students practice the concepts, skills, and strategies developed in Lessons 1–10.",
      },
      {
        order: 14,
        type: "Mid-Unit Check",
        title: "M1.4 Sub-Unit Quiz",
        subtitle: null,
        isOptional: false,
        summary:
          "Learn about your students' understanding of the concepts and skills so far in this unit.",
      },
      {
        order: 15,
        type: "Lesson",
        title: "Recursion Excursion",
        subtitle: "Lesson 11: Writing Sequences in Function Notation",
        isOptional: false,
        summary:
          "Let's write a recursive definition for a sequence using function notation.",
      },
      {
        order: 16,
        type: "Lesson",
        title: "Functions and Sequences",
        subtitle: "Lesson 12: Using Functions to Model Sequences",
        isOptional: false,
        summary: "Let's look at different ways to write sequences.",
      },
      {
        order: 17,
        type: "Lesson",
        title: "What's Your Score?",
        subtitle: "Lesson 13: Absolute Value Functions, Part 1",
        isOptional: false,
        summary: "Let's make sense of absolute value functions.",
      },
      {
        order: 18,
        type: "Lesson",
        title: "Absolute Value Machines",
        subtitle: "Lesson 14: Absolute Value Functions, Part 2",
        isOptional: false,
        summary: "Let's graph absolute value functions.",
      },
      {
        order: 19,
        type: "Lesson",
        title: "Our Math Stories",
        subtitle: "Lesson 15: Using Functions to Tell Stories",
        isOptional: false,
        summary: "Let's use functions and graphs to model math stories.",
      },
      {
        order: 20,
        type: "Practice",
        title: "M1.4 Practice Day 2",
        subtitle: null,
        isOptional: false,
        summary:
          "Students practice the concepts, skills, and strategies developed in Lessons 1–15.",
        provenanceNote:
          "Source PDF included three duplicate pages for this item, byte-for-byte identical; treated as one instructional item, not three (Extraction Note #9).",
      },
      {
        order: 21,
        type: "Assessment",
        title: "M1.4 Performance Task",
        subtitle: null,
        isOptional: false,
        summary:
          "Assign this summative assessment performance task at the end of the unit to evaluate students' proficiency with the concepts and skills addressed in the unit.",
      },
      {
        order: 22,
        type: "Reflection",
        title: "Unit Synthesis and Reflection",
        subtitle: null,
        isOptional: false,
        summary:
          "Six optional activities for students to engage in at the end of a unit to synthesize and/or reflect on their learning.",
      },
    ],
    flexibleItems: [],
  },

  {
    unitNumber: 5,
    title: "Exponential Functions",
    purpose:
      "Students compare and contrast features of a linear function and an exponential function by creating and exploring equations, tables, and graphs. They investigate situations that grow or decay by a percentage rate per unit interval called a growth factor, and use the growth factor to write exponential growth or exponential decay functions to model and solve real situations such as those involving compound interest. Students fit and interpret functions that model the data between two quantities using linear or exponential functions.",
    requiredDays: { status: "not_yet_verified", value: null },
    optionalDays: { status: "not_yet_verified", value: null },
    items: [
      {
        order: 1,
        type: "Pre-Unit Check",
        title: "M1.5 Pre-Unit Check",
        subtitle: null,
        isOptional: true,
        summary:
          "Learn more about your students' understanding of foundational concepts and skills that will support them in the upcoming unit.",
      },
      {
        order: 2,
        type: "Explore",
        title: "An Epidemic",
        subtitle: "Explore: An Epidemic",
        isOptional: true,
        summary: "How does an epidemic grow?",
      },
      {
        order: 3,
        type: "Lesson",
        title: "Carlos's Fish",
        subtitle: "Lesson 1: Equations of Exponential Relationships",
        isOptional: true,
        summary:
          "Let's make connections between exponential equations and the situations they represent.",
      },
      {
        order: 4,
        type: "Lesson",
        title: "Growing Globs",
        subtitle: "Lesson 2: Patterns of Growth",
        isOptional: false,
        summary: "Let's identify and compare two different patterns of growth.",
      },
      {
        order: 5,
        type: "Lesson",
        title: "Going Viral",
        subtitle: "Lesson 3: Graphs and Exponential Relationships",
        isOptional: false,
        summary:
          "Let's describe connections between graphs and equations and use graphs to write equations of exponential functions.",
      },
      {
        order: 6,
        type: "Lesson",
        title: "Return of the Globs",
        subtitle:
          "Lesson 4: Connecting Representations of Linear and Exponential Functions",
        isOptional: false,
        summary:
          "Let's make connections between different representations of linear and exponential functions.",
      },
      {
        order: 7,
        type: "Lesson",
        title: "Carlos and Corals",
        subtitle: "Lesson 5: Evaluating Exponential Functions",
        isOptional: false,
        summary:
          "Let's evaluate exponential functions with inputs that are positive, negative, and zero.",
      },
      {
        order: 8,
        type: "Lesson",
        title: "Differences and Factors",
        subtitle: "Lesson 6: Changes Over Equal Intervals",
        isOptional: false,
        summary:
          "Let's generalize how linear and exponential functions change over equal intervals.",
      },
      {
        order: 9,
        type: "Lesson",
        title: "Growing Mold",
        subtitle: "Lesson 7: Percent Increase and Decrease, Part 1",
        isOptional: false,
        summary:
          "Let's explore how to model situations that change by percent increase with exponential functions.",
      },
      {
        order: 10,
        type: "Lesson",
        title: "At a Loss",
        subtitle: "Lesson 8: Percent Increase and Decrease, Part 2",
        isOptional: false,
        summary:
          "Let's make connections between different representations of exponential decay functions.",
      },
      {
        order: 11,
        type: "Lesson",
        title: "Lake Desmosia",
        subtitle: "Lesson 9: Solving Problems Involving Percent Growth and Decay",
        isOptional: false,
        summary:
          "Let's use exponential functions to solve problems about situations that grow or decay by a percent.",
      },
      {
        order: 12,
        type: "Lesson",
        title: "Marbleslides: Exponentials",
        subtitle: "Lesson 10: Translations of Exponential Functions",
        isOptional: false,
        summary:
          "Let's practice translating exponential functions by playing a game.",
      },
      {
        order: 13,
        type: "Practice",
        title: "M1.5 Practice Day 1",
        subtitle: null,
        isOptional: false,
        summary:
          "Students practice the concepts, skills, and strategies developed in Lessons 1–10.",
      },
      {
        order: 14,
        type: "Mid-Unit Check",
        title: "M1.5 Sub-Unit Quiz",
        subtitle: null,
        isOptional: false,
        summary:
          "Learn about your students' understanding of the concepts and skills so far in this unit.",
      },
      {
        order: 15,
        type: "Lesson",
        title: "Bank Accounts",
        subtitle: "Lesson 11: Introducing Simple and Compound Interest",
        isOptional: false,
        summary:
          "Let's learn how to model situations involving simple and compound interest.",
      },
      {
        order: 16,
        type: "Lesson",
        title: "Payday Loan",
        subtitle: "Lesson 12: Revisiting Compound Interest",
        isOptional: false,
        summary:
          "Let's analyze exponential functions that represent different compound interest scenarios.",
      },
      {
        order: 17,
        type: "Lesson",
        title: "Credit Card Compounding",
        subtitle: "Lesson 13: Different Compounding Intervals",
        isOptional: false,
        summary:
          "Let's explore how to calculate and compare account balances with interest rates that compound at different intervals.",
      },
      {
        order: 18,
        type: "Lesson",
        title: "Detroit's Population, Part 1",
        subtitle: "Lesson 14: Modeling Data and Goodness of Fit",
        isOptional: false,
        summary:
          "Let's use functions to model the population growth of Detroit.",
      },
      {
        order: 19,
        type: "Lesson",
        title: "Detroit's Population, Part 2",
        subtitle: "Lesson 15: Modeling Exponential Data",
        isOptional: false,
        summary: "Let's use functions to model the population of Detroit.",
      },
      {
        order: 20,
        type: "Practice",
        title: "M1.5 Practice Day 2",
        subtitle: null,
        isOptional: false,
        summary:
          "Students practice the concepts, skills, and strategies developed in Lessons 1–15.",
      },
      {
        order: 21,
        type: "Assessment",
        title: "M1.5 Performance Task",
        subtitle: null,
        isOptional: false,
        summary:
          "Assign this summative assessment performance task at the end of the unit to evaluate students' proficiency with the concepts and skills addressed in the unit.",
      },
      {
        order: 22,
        type: "Reflection",
        title: "Unit Synthesis and Reflection",
        subtitle: null,
        isOptional: false,
        summary:
          "Six optional activities for students to engage in at the end of a unit to synthesize and/or reflect on their learning.",
      },
    ],
    flexibleItems: [
      {
        type: "Investigate",
        title: "Tuition Costs",
        subtitle: "Investigate: Tuition Costs",
        isOptional: true,
        summary:
          "Invite students to explore tuition cost trends at post-secondary institutions.",
        placementRule: "any time in this course after Unit 5, Lesson 15",
        provenanceNote:
          "No fixed Order and no dedicated source page — mentioned only on the unit-overview page (Extraction Notes #6–7).",
      },
    ],
  },

  {
    unitNumber: 6,
    title: "Rigid Transformations and Congruence",
    purpose:
      "Students construct geometric figures using a variety of tools, then use their construction strategies to perform rigid transformations. Students use the definition of congruence in terms of rigid transformations to establish that corresponding parts of congruent triangles are congruent, then explain how the criteria for triangle congruence (ASA, SAS, and SSS) follow from this.",
    requiredDays: { status: "not_yet_verified", value: null },
    optionalDays: { status: "not_yet_verified", value: null },
    items: [
      {
        order: 1,
        type: "Pre-Unit Check",
        title: "M1.6 Pre-Unit Check",
        subtitle: null,
        isOptional: true,
        summary:
          "Learn more about your students' understanding of foundational concepts and skills that will support them in the upcoming unit.",
      },
      {
        order: 2,
        type: "Explore",
        title: "Making Precise Symbols",
        subtitle: "Explore: Making Precise Symbols",
        isOptional: true,
        optionalityBasis:
          'Labeled "(Optional)" on the unit-overview page, but the item\'s own dedicated card carries no "OPTIONAL" badge — a source inconsistency, not a transcription gap (Extraction Note #11).',
        summary:
          "How are geometric shapes and concepts used in art and culture?",
      },
      {
        order: 3,
        type: "Lesson",
        title: "Circles and Segments",
        subtitle: "Lesson 1: An Introduction to Constructions",
        isOptional: false,
        summary: "Let's construct designs using circles and line segments.",
      },
      {
        order: 4,
        type: "Lesson",
        title: "Compass Constructions",
        subtitle: "Lesson 2: Constructing Patterns",
        isOptional: false,
        summary: "Let's use a compass to make precise designs on paper.",
      },
      {
        order: 5,
        type: "Lesson",
        title: "Constructing Digitally",
        subtitle: "Lesson 3: Geometric Constructions",
        isOptional: false,
        summary: "Let's explore how to communicate to each other about constructions.",
      },
      {
        order: 6,
        type: "Lesson",
        title: "Right in the Middle",
        subtitle: "Lesson 4: Constructing Perpendicular Bisectors",
        isOptional: false,
        summary: "Let's explore equal distances through constructions.",
      },
      {
        order: 7,
        type: "Lesson",
        title: "Lines of Construction",
        subtitle: "Lesson 5: Constructing Perpendicular and Parallel Lines",
        isOptional: false,
        summary:
          "Let's develop strategies to construct perpendicular and parallel lines.",
      },
      {
        order: 8,
        type: "Lesson",
        title: "Square Up",
        subtitle: "Lesson 6: Constructing Squares",
        isOptional: false,
        summary: "Let's make squares using circles.",
      },
      {
        order: 9,
        type: "Lesson",
        title: "Community Constructions",
        subtitle: "Lesson 7: Using Perpendicular Bisectors",
        isOptional: false,
        summary: "Let's use constructions to help us make decisions.",
      },
      {
        order: 10,
        type: "Practice Day",
        title: "M1.6 Practice Day 1",
        subtitle: null,
        isOptional: false,
        summary:
          "Students practice the concepts, skills, and strategies developed in Lessons 1–7.",
      },
      {
        order: 11,
        type: "Lesson",
        title: "Going Off the Grid, Part 1",
        subtitle: "Lesson 8: Introducing Sequences of Transformations",
        isOptional: false,
        summary:
          "Let's explore how we can describe sliding, flipping, and spinning shapes.",
      },
      {
        order: 12,
        type: "Lesson",
        title: "Time to Reflect",
        subtitle: "Lesson 9: Defining Reflections",
        isOptional: false,
        summary: "Let's get precise about reflections.",
      },
      {
        order: 13,
        type: "Lesson",
        title: "Translation Information",
        subtitle: "Lesson 10: Defining Translations",
        isOptional: false,
        summary: "Let's get precise about translations.",
      },
      {
        order: 14,
        type: "Lesson",
        title: "Rotation Devices",
        subtitle: "Lesson 11: Defining Rotations",
        isOptional: false,
        summary: "Let's get precise about rotations.",
      },
      {
        order: 15,
        type: "Lesson",
        title: "Going Off the Grid, Part 2",
        subtitle: "Lesson 12: Specifying Sequences of Transformations",
        isOptional: false,
        summary:
          "Let's use geometry tools to perform sequences of rigid transformations that move one figure onto another.",
      },
      {
        order: 16,
        type: "Lesson",
        title: "Tiles and Patterns",
        subtitle:
          "Lesson 13: Geometric Art Using Constructions and Transformations",
        isOptional: true,
        summary: "Let's use transformations to describe and create patterns.",
      },
      {
        order: 17,
        type: "Lesson",
        title: "Reflectional Symmetry",
        subtitle:
          "Lesson 14: Describing Reflections that Take a Figure Onto Itself",
        isOptional: false,
        summary:
          "Let's explore what it means for a figure to have reflectional symmetry.",
      },
      {
        order: 18,
        type: "Lesson",
        title: "Rotational Symmetry",
        subtitle:
          "Lesson 15: Describing Rotations that Take a Figure Onto Itself",
        isOptional: false,
        summary:
          "Let's explore what it means for a figure to have rotational symmetry.",
      },
      {
        order: 19,
        type: "Lesson",
        title: "Transformations as Functions",
        subtitle: "Lesson 16: Using Coordinate Transformation Notation",
        isOptional: false,
        summary:
          "Let's explore how we can represent transformations as functions.",
      },
      {
        order: 20,
        type: "Practice Day",
        title: "M1.6 Practice Day 2",
        subtitle: null,
        isOptional: false,
        summary:
          "Students practice the concepts, skills, and strategies developed in Lessons 1–16.",
      },
      {
        order: 21,
        type: "Sub-Unit Quiz",
        title: "M1.6 Sub-Unit Quiz",
        subtitle: null,
        isOptional: false,
        summary:
          "Learn about your students' understanding of the concepts and skills so far in this unit.",
      },
      {
        order: 22,
        type: "Lesson",
        title: "Congruent Parts, Part 1",
        subtitle: "Lesson 17: Defining Congruence",
        isOptional: false,
        summary:
          "Let's inspect what corresponding sides and angles in figures have to do with congruence.",
      },
      {
        order: 23,
        type: "Lesson",
        title: "Congruent Parts, Part 2",
        subtitle: "Lesson 18: Congruence Statements",
        isOptional: false,
        summary: "Let's name figures in ways that help us see corresponding parts.",
      },
      {
        order: 24,
        type: "Lesson",
        title: "Congruent Triangles, Part 1",
        subtitle:
          "Lesson 19: Determining Information Needed for Triangle Congruence",
        isOptional: false,
        summary:
          "Let's use rigid transformations to determine whether two triangles are congruent.",
      },
      {
        order: 25,
        type: "Lesson",
        title: "Congruent Triangles, Part 2",
        subtitle: "Lesson 20: Determining Shortcuts for Triangle Congruence",
        isOptional: false,
        summary:
          "Let's explore shortcuts for determining whether two triangles are congruent.",
      },
      {
        order: 26,
        type: "Lesson",
        title: "Triangle Palindromes",
        subtitle: "Lesson 21: ASA and SAS Triangle Congruence Theorems",
        isOptional: false,
        summary: "Let's explore two ways to show triangle congruence.",
      },
      {
        order: 27,
        type: "Lesson",
        title: "Another Triangle Congruence Theorem",
        subtitle: "Lesson 22: Side-Side-Side Triangle Congruence Theorem",
        isOptional: false,
        summary: "Let's explore one more congruence theorem.",
      },
      {
        order: 28,
        type: "Practice Day",
        title: "M1.6 Practice Day 3",
        subtitle: null,
        isOptional: false,
        summary:
          "Students practice the concepts, skills, and strategies developed in Lessons 1–22.",
      },
      {
        order: 29,
        type: "Performance Task",
        title: "M1.6 Performance Task",
        subtitle: null,
        isOptional: false,
        summary:
          "Assign this summative assessment performance task at the end of the unit to evaluate students' proficiency with the concepts and skills addressed in the unit.",
      },
      {
        order: 30,
        type: "Unit Synthesis and Reflection",
        title: "Unit Synthesis and Reflection",
        subtitle: null,
        isOptional: false,
        summary:
          "Six optional activities for students to engage in at the end of a unit to synthesize and/or reflect on their learning.",
      },
    ],
    flexibleItems: [],
  },

  {
    unitNumber: 7,
    title: "Describing Data",
    purpose:
      "Students learn to distinguish between categorical and quantitative data. They learn to organize categorical data in two-way frequency tables and create conditional relative-frequency tables to make decisions. They analyze one- and two-variable data sets, using statistics appropriate to the shape of the data to compare one-variable data sets (mean and standard deviation, or median and IQR). They use scatter plots with the line of best fit and the correlation coefficient for two-variable data, and consider whether a relationship represents causation or correlation.",
    requiredDays: { status: "not_yet_verified", value: null },
    optionalDays: { status: "not_yet_verified", value: null },
    items: [
      {
        order: 1,
        type: "Pre-Unit Check",
        title: "M1.7 Pre-Unit Check",
        subtitle: null,
        isOptional: true,
        summary:
          "Learn more about your students' understanding of foundational concepts and skills that will support them in the upcoming unit.",
      },
      {
        order: 2,
        type: "Explore",
        title: "A Statistical Question",
        subtitle: "Explore: A Statistical Question",
        isOptional: true,
        summary: "What is a statistical question?",
      },
      {
        order: 3,
        type: "Lesson",
        title: "Survey Says",
        subtitle: "Lesson 1: What Kinds of Data Can I Collect?",
        isOptional: true,
        summary:
          "Let's make sense of the kinds of data that can be collected and write questions to get to know each other better.",
      },
      {
        order: 4,
        type: "Lesson",
        title: "Hear Here",
        subtitle: "Lesson 2: Two-Way Tables and Relative Frequency Tables",
        isOptional: false,
        summary: "Let's use categorical data to make an argument.",
      },
      {
        order: 5,
        type: "Lesson",
        title: "School Choice",
        subtitle: "Lesson 3: Making Decisions With Frequency Tables",
        isOptional: false,
        summary: "Let's use data to make decisions and write arguments.",
      },
      {
        order: 6,
        type: "Lesson",
        title: "Love it or Leave it",
        subtitle: "Lesson 4: Revisiting Dot Plots and Histograms",
        isOptional: false,
        summary:
          "Let's make sense of dot plots and histograms as ways to visualize one-variable data.",
      },
      {
        order: 7,
        type: "Lesson",
        title: "Better Weather?",
        subtitle: "Lesson 5: Revisiting Box Plots",
        isOptional: false,
        summary: "Let's use box plots to visualize and compare weather data.",
      },
      {
        order: 8,
        type: "Lesson",
        title: "Shapes of Data",
        subtitle: "Lesson 6: Describing Data Sets",
        isOptional: false,
        summary: "Let's describe different shapes of data.",
      },
      {
        order: 9,
        type: "Lesson",
        title: "Quick Pick",
        subtitle: "Lesson 7: Revisiting Measures of Center",
        isOptional: false,
        summary: "Let's explore how extreme values impact mean and median.",
      },
      {
        order: 10,
        type: "Lesson",
        title: "Finding Desmo",
        subtitle: "Lesson 8: Introduction to Standard Deviation",
        isOptional: false,
        summary: "Let's explore what standard deviation describes about a data set.",
      },
      {
        order: 11,
        type: "Lesson",
        title: "Wavering Weather",
        subtitle: "Lesson 9: Comparing Data Using Mean and Standard Deviation",
        isOptional: false,
        summary:
          "Let's use mean and standard deviation to compare the temperatures in different cities.",
      },
      {
        order: 12,
        type: "Lesson",
        title: "Race Car",
        subtitle: "Lesson 10: Comparing Data Using Median and IQR",
        isOptional: false,
        summary: "Let's compare measures of spread in skewed data sets.",
      },
      {
        order: 13,
        type: "Lesson",
        title: "Far Out",
        subtitle: "Lesson 11: Identifying Outliers",
        isOptional: false,
        summary:
          "Let's determine whether or not a data point is an outlier, and consider its effect on the mean and median.",
      },
      {
        order: 14,
        type: "Lesson",
        title: "Dynamic Decades",
        subtitle: "Lesson 12: Comparing Data Using Measures of Center and Spread",
        isOptional: false,
        summary:
          "Let's use measures of center and spread to describe how aspects of the United States have changed over time.",
      },
      {
        order: 15,
        type: "Practice Day",
        title: "M1.7 Practice Day 1",
        subtitle: null,
        isOptional: false,
        summary:
          "Students practice the concepts, skills, and strategies developed in Lessons 1–12.",
      },
      {
        order: 16,
        type: "Sub-Unit Quiz",
        title: "M1.7 Sub-Unit Quiz",
        subtitle: null,
        isOptional: false,
        summary:
          "Learn about your students' understanding of the concepts and skills so far in this unit.",
      },
      {
        order: 17,
        type: "Lesson",
        title: "Correlation Coefficient",
        subtitle: "Lesson 13: Introduction to the Correlation Coefficient",
        isOptional: false,
        summary:
          "Let's learn about the correlation coefficient (r-value) as a way to measure the strength and direction of a linear relationship.",
      },
      {
        order: 18,
        type: "Lesson",
        title: "How Hot Is It?",
        subtitle: "Lesson 14: Interpreting the Correlation Coefficient in Context",
        isOptional: false,
        summary:
          "Let's use correlation coefficients to analyze relationships between income, tree cover, and average temperature.",
      },
      {
        order: 19,
        type: "Lesson",
        title: "City Slopes",
        subtitle: "Lesson 15: Interpreting Slope and y-intercept in Context",
        isOptional: false,
        summary:
          "Let's use a line of fit to describe the relationship between two variables and make predictions.",
      },
      {
        order: 20,
        type: "Lesson",
        title: "Residual Fruit",
        subtitle: "Lesson 16: Residuals and Residual Plots",
        isOptional: false,
        summary: "Let's use residual plots to determine how well a line fits data.",
      },
      {
        order: 21,
        type: "Lesson",
        title: "Penguin Populations",
        subtitle: "Lesson 17: Using Technology to Generate the Line of Best Fit",
        isOptional: false,
        summary:
          "Let's generate and analyze lines of best fit to explore how penguin populations have changed over time.",
      },
      {
        order: 22,
        type: "Lesson",
        title: "Behind the Headlines",
        subtitle: "Lesson 18: Causation vs. Correlation",
        isOptional: false,
        summary: "Let's consider the differences between correlation and causation.",
      },
      {
        order: 23,
        type: "Lesson",
        title: "City Data",
        subtitle: "Lesson 19: Using Statistics to Analyze Relationships in Society",
        isOptional: false,
        summary:
          "Let's apply what we've learned about analyzing two-variable data to explore relationships between variables in society.",
      },
      {
        order: 24,
        type: "Practice Day",
        title: "M1.7 Practice Day 2",
        subtitle: null,
        isOptional: false,
        summary:
          "Students practice the concepts, skills, and strategies developed in Lessons 1–19.",
      },
      {
        order: 25,
        type: "Performance Task",
        title: "M1.7 Performance Task",
        subtitle: null,
        isOptional: false,
        summary:
          "Assign this summative assessment performance task at the end of the unit to evaluate students' proficiency with the concepts and skills addressed in the unit.",
      },
      {
        order: 26,
        type: "Unit Synthesis and Reflection",
        title: "Unit Synthesis and Reflection",
        subtitle: null,
        isOptional: false,
        summary:
          "Six optional activities for students to engage in at the end of a unit to synthesize and/or reflect on their learning.",
      },
    ],
    flexibleItems: [
      {
        type: "Investigate",
        title: "Exploring Climate Change",
        subtitle: "Investigate: Exploring Climate Change",
        isOptional: true,
        summary:
          "Invite students to investigate a global issue and identify actions to reduce their carbon footprint.",
        placementRule: "anytime in this course after Unit 7, Lesson 19",
        provenanceNote:
          "No fixed Order and no dedicated source page — same pattern as Unit 5's Investigate item (Extraction Note #12).",
      },
    ],
  },
];
