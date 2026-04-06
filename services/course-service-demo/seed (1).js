import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Seed user IDs ────────────────────────────────────────────────────────────
const AUTHORS = [
  "seed-author-001",
  "seed-author-002",
  "seed-author-003",
  "seed-author-004",
];

const STUDENTS = [
  "seed-student-001",
  "seed-student-002",
  "seed-student-003",
  "seed-student-004",
  "seed-student-005",
];

// ─── YouTube embed URLs (real free courses, topic-relevant) ───────────────────
const TOPIC_VIDEOS = {
  python: [
    "https://www.youtube.com/embed/kqtD5dpn9C8",  // Python for Beginners - Programming with Mosh
    "https://www.youtube.com/embed/rfscVS0vtbw",  // Python Full Course - freeCodeCamp
    "https://www.youtube.com/embed/_uQrJ0TkZlc",  // Python Tutorial - Tech With Tim
    "https://www.youtube.com/embed/t8pPdKYpowI",  // Python Crash Course - Traversy Media
    "https://www.youtube.com/embed/HGOBQPFzWKo",  // Intermediate Python - NeuralNine
    "https://www.youtube.com/embed/Z1Yd7upQsXY",  // Python Data Structures - CS Dojo
  ],
  javascript: [
    "https://www.youtube.com/embed/W6NZfCO5SIk",  // JavaScript for Beginners - Programming with Mosh
    "https://www.youtube.com/embed/PkZNo7MFNFg",  // JavaScript Full Course - freeCodeCamp
    "https://www.youtube.com/embed/hdI2bqOjy3c",  // JS Crash Course - Traversy Media
    "https://www.youtube.com/embed/jS4aFq5-91M",  // JavaScript Full Course - SuperSimpleDev
    "https://www.youtube.com/embed/Qqx_wzMmFeA",  // Async JS - Traversy Media
    "https://www.youtube.com/embed/hKB-YGF14SY",  // JS DOM Crash Course - Traversy Media
  ],
  typescript: [
    "https://www.youtube.com/embed/BwuLxPH8IDs",  // TypeScript Full Course - Programming with Mosh
    "https://www.youtube.com/embed/30LWjhZzg50",  // TypeScript Crash Course - Traversy Media
    "https://www.youtube.com/embed/d56mG7DezGs",  // TypeScript Tutorial - Net Ninja
    "https://www.youtube.com/embed/ydkQlJhodio",  // TypeScript Generics - Matt Pocock
    "https://www.youtube.com/embed/BCg4U1FzODs",  // TypeScript Full Course - freeCodeCamp
    "https://www.youtube.com/embed/SpwzRDXQ3po",  // TypeScript for Beginners - Academind
  ],
  react: [
    "https://www.youtube.com/embed/Ke90Tje7VS0",  // React in 100 Seconds - Fireship
    "https://www.youtube.com/embed/w7ejDZ8SWv8",  // React Crash Course - Traversy Media
    "https://www.youtube.com/embed/4UZrsTqkcW4",  // React Full Course - freeCodeCamp
    "https://www.youtube.com/embed/j942wKiXFu8",  // React Hooks - Traversy Media
    "https://www.youtube.com/embed/RVFAyFWO4go",  // React Tutorial - Programming with Mosh
    "https://www.youtube.com/embed/0mVbNp1ol_w",  // React 18 - Academind
  ],
  node: [
    "https://www.youtube.com/embed/fBNz5xF-Kx4",  // Node.js Crash Course - Traversy Media
    "https://www.youtube.com/embed/TlB_eWDSMt4",  // Node.js Full Course - Programming with Mosh
    "https://www.youtube.com/embed/Oe421EPjeBE",  // Node.js and Express - freeCodeCamp
    "https://www.youtube.com/embed/zb3Qk8SG5Ms",  // REST API with Node - Traversy Media
    "https://www.youtube.com/embed/ENrzD9HAZK4",  // Node.js Tutorial - Net Ninja
    "https://www.youtube.com/embed/l8WPWK9mS5M",  // Express JS Crash Course - Traversy Media
  ],
  sql: [
    "https://www.youtube.com/embed/HXV3zeQKqGY",  // SQL Full Course - freeCodeCamp
    "https://www.youtube.com/embed/qw--VYLpxG4",  // SQL Tutorial - Programming with Mosh
    "https://www.youtube.com/embed/zsjvFFKOm3c",  // PostgreSQL Full Course - freeCodeCamp
    "https://www.youtube.com/embed/4cVDjWCciXs",  // SQL Crash Course - Traversy Media
    "https://www.youtube.com/embed/p3qvj9hO_Bo",  // SQL for Beginners - Amigoscode
    "https://www.youtube.com/embed/a-hFbr-4VQQ",  // MySQL Full Course - Bro Code
  ],
  devops: [
    "https://www.youtube.com/embed/pTFZFxd5uri",  // Docker Full Course - TechWorld with Nana
    "https://www.youtube.com/embed/fqMOX6JJhGo",  // Docker Tutorial - freeCodeCamp
    "https://www.youtube.com/embed/3c-iBn73dDE",  // Docker Crash Course - TechWorld with Nana
    "https://www.youtube.com/embed/Gjnup-PuquQ",  // Git and GitHub - freeCodeCamp
    "https://www.youtube.com/embed/9zUHg7xjIqQ",  // CI/CD Pipeline - TechWorld with Nana
    "https://www.youtube.com/embed/RIyPGtKQ-aU",  // Kubernetes Full Course - TechWorld with Nana
  ],
  default: [
    "https://www.youtube.com/embed/kqtD5dpn9C8",
    "https://www.youtube.com/embed/W6NZfCO5SIk",
    "https://www.youtube.com/embed/BwuLxPH8IDs",
    "https://www.youtube.com/embed/Ke90Tje7VS0",
    "https://www.youtube.com/embed/fBNz5xF-Kx4",
    "https://www.youtube.com/embed/HXV3zeQKqGY",
  ],
};

// ─── Topic-specific thumbnails ────────────────────────────────────────────────
const COURSE_THUMBNAILS = {
  "python-for-beginners":
    "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=1280&h=720&fit=crop",
  "python-data-science":
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1280&h=720&fit=crop",
  "javascript-fundamentals":
    "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=1280&h=720&fit=crop",
  "advanced-javascript":
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1280&h=720&fit=crop",
  "typescript-in-depth":
    "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=1280&h=720&fit=crop",
  "react-complete-guide":
    "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=1280&h=720&fit=crop",
  "nextjs-production":
    "https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=1280&h=720&fit=crop",
  "node-rest-apis":
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1280&h=720&fit=crop",
  "postgresql-mastery":
    "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1280&h=720&fit=crop",
  "docker-and-containers":
    "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=1280&h=720&fit=crop",
  "git-and-github":
    "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=1280&h=720&fit=crop",
  "system-design-fundamentals":
    "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1280&h=720&fit=crop",
};

// ─── Course-specific quiz questions per section ───────────────────────────────
// Each entry: [sectionIndex 0-based]: array of 2-4 questions
const COURSE_QUIZ_QUESTIONS = {
  "python-for-beginners": {
    0: [
      {
        id: "q1", text: "Which keyword is used to define a function in Python?",
        options: ["func", "def", "function", "define"],
        correctAnswer: "def",
      },
      {
        id: "q2", text: "What is the correct way to print 'Hello World' in Python?",
        options: ["echo('Hello World')", "print('Hello World')", "console.log('Hello World')", "printf('Hello World')"],
        correctAnswer: "print('Hello World')",
      },
      {
        id: "q3", text: "Which data type is used to store text in Python?",
        options: ["int", "bool", "str", "char"],
        correctAnswer: "str",
      },
    ],
    1: [
      {
        id: "q1", text: "What does a 'for' loop iterate over in Python?",
        options: ["Only numbers", "Only strings", "Any iterable", "Only lists"],
        correctAnswer: "Any iterable",
      },
      {
        id: "q2", text: "Which keyword exits a loop immediately in Python?",
        options: ["exit", "stop", "break", "return"],
        correctAnswer: "break",
      },
      {
        id: "q3", text: "What does range(5) produce?",
        options: ["[1,2,3,4,5]", "[0,1,2,3,4]", "[0,1,2,3,4,5]", "[1,2,3,4]"],
        correctAnswer: "[0,1,2,3,4]",
      },
      {
        id: "q4", text: "What is a list comprehension?",
        options: ["A way to import lists", "A concise way to create lists", "A type of loop", "A sorting method"],
        correctAnswer: "A concise way to create lists",
      },
    ],
    2: [
      {
        id: "q1", text: "What is the scope of a variable defined inside a function?",
        options: ["Global", "Local", "Module", "Class"],
        correctAnswer: "Local",
      },
      {
        id: "q2", text: "Which built-in function returns the number of items in a list?",
        options: ["count()", "size()", "len()", "length()"],
        correctAnswer: "len()",
      },
      {
        id: "q3", text: "What keyword is used to import a module in Python?",
        options: ["include", "require", "import", "use"],
        correctAnswer: "import",
      },
    ],
  },

  "python-data-science": {
    0: [
      {
        id: "q1", text: "Which library provides the DataFrame data structure in Python?",
        options: ["NumPy", "pandas", "matplotlib", "scikit-learn"],
        correctAnswer: "pandas",
      },
      {
        id: "q2", text: "What method loads a CSV file into a pandas DataFrame?",
        options: ["pd.load_csv()", "pd.read_csv()", "pd.open_csv()", "pd.import_csv()"],
        correctAnswer: "pd.read_csv()",
      },
      {
        id: "q3", text: "Which pandas method drops rows with missing values?",
        options: ["removeNaN()", "dropna()", "fillna()", "clean()"],
        correctAnswer: "dropna()",
      },
    ],
    1: [
      {
        id: "q1", text: "Which library is used for creating static visualizations in Python?",
        options: ["pandas", "NumPy", "matplotlib", "TensorFlow"],
        correctAnswer: "matplotlib",
      },
      {
        id: "q2", text: "What type of chart is best for showing distributions?",
        options: ["Line chart", "Pie chart", "Histogram", "Scatter plot"],
        correctAnswer: "Histogram",
      },
      {
        id: "q3", text: "Which seaborn function creates a correlation heatmap?",
        options: ["sns.scatter()", "sns.heatmap()", "sns.bar()", "sns.line()"],
        correctAnswer: "sns.heatmap()",
      },
    ],
    2: [
      {
        id: "q1", text: "What is the purpose of train/test split in machine learning?",
        options: ["To speed up training", "To evaluate model on unseen data", "To reduce dataset size", "To balance classes"],
        correctAnswer: "To evaluate model on unseen data",
      },
      {
        id: "q2", text: "Which algorithm is used for predicting continuous values?",
        options: ["Logistic Regression", "K-Means", "Linear Regression", "Decision Tree Classifier"],
        correctAnswer: "Linear Regression",
      },
      {
        id: "q3", text: "What does GridSearchCV do in scikit-learn?",
        options: ["Visualizes the model", "Searches for best hyperparameters", "Splits data into grids", "Creates feature crosses"],
        correctAnswer: "Searches for best hyperparameters",
      },
      {
        id: "q4", text: "Which preprocessing step converts categorical text to numbers?",
        options: ["StandardScaler", "MinMaxScaler", "OneHotEncoder", "PCA"],
        correctAnswer: "OneHotEncoder",
      },
    ],
  },

  "javascript-fundamentals": {
    0: [
      {
        id: "q1", text: "Which keyword declares a block-scoped variable in JavaScript?",
        options: ["var", "let", "const", "Both let and const"],
        correctAnswer: "Both let and const",
      },
      {
        id: "q2", text: "What does === check in JavaScript?",
        options: ["Only value equality", "Only type equality", "Both value and type equality", "Reference equality only"],
        correctAnswer: "Both value and type equality",
      },
      {
        id: "q3", text: "Which of these is NOT a primitive type in JavaScript?",
        options: ["string", "boolean", "object", "symbol"],
        correctAnswer: "object",
      },
    ],
    1: [
      {
        id: "q1", text: "Which array method transforms each element and returns a new array?",
        options: ["filter()", "forEach()", "map()", "reduce()"],
        correctAnswer: "map()",
      },
      {
        id: "q2", text: "What does the spread operator (...) do?",
        options: ["Deletes array elements", "Expands an iterable into individual elements", "Merges two objects by reference", "Creates a deep clone"],
        correctAnswer: "Expands an iterable into individual elements",
      },
      {
        id: "q3", text: "Which loop is used to iterate over object keys?",
        options: ["for...of", "for...in", "forEach", "while"],
        correctAnswer: "for...in",
      },
    ],
    2: [
      {
        id: "q1", text: "What does async/await do in JavaScript?",
        options: ["Makes code run faster", "Allows writing async code that looks synchronous", "Runs code in parallel threads", "Prevents all errors"],
        correctAnswer: "Allows writing async code that looks synchronous",
      },
      {
        id: "q2", text: "What does Promise.all() do?",
        options: ["Runs promises one by one", "Runs all promises in parallel and waits for all", "Returns the first resolved promise", "Catches all errors"],
        correctAnswer: "Runs all promises in parallel and waits for all",
      },
      {
        id: "q3", text: "Which API is used to make HTTP requests natively in the browser?",
        options: ["XMLHttpRequest only", "axios", "fetch", "http.get"],
        correctAnswer: "fetch",
      },
      {
        id: "q4", text: "Where should you handle errors in async/await code?",
        options: ["Inside the promise", "Using .catch() only", "Using try/catch", "Errors can't occur in async code"],
        correctAnswer: "Using try/catch",
      },
    ],
  },

  "advanced-javascript": {
    0: [
      {
        id: "q1", text: "What is a closure in JavaScript?",
        options: [
          "A way to close the browser",
          "A function that retains access to its outer scope after the outer function returns",
          "A method to seal an object",
          "A type of loop",
        ],
        correctAnswer: "A function that retains access to its outer scope after the outer function returns",
      },
      {
        id: "q2", text: "What does Object.create() do?",
        options: ["Clones an object deeply", "Creates an object with a specified prototype", "Freezes an object", "Merges two objects"],
        correctAnswer: "Creates an object with a specified prototype",
      },
      {
        id: "q3", text: "What does the 'this' keyword refer to in an arrow function?",
        options: ["The arrow function itself", "The global object always", "The enclosing lexical context", "undefined always"],
        correctAnswer: "The enclosing lexical context",
      },
    ],
    1: [
      {
        id: "q1", text: "Which pattern is used to notify multiple subscribers of state changes?",
        options: ["Factory Pattern", "Observer Pattern", "Singleton Pattern", "Strategy Pattern"],
        correctAnswer: "Observer Pattern",
      },
      {
        id: "q2", text: "What does memoisation do?",
        options: ["Stores function results to avoid recomputation", "Compresses memory usage", "Clears the call stack", "Runs functions in memory"],
        correctAnswer: "Stores function results to avoid recomputation",
      },
      {
        id: "q3", text: "What is currying?",
        options: [
          "Converting a multi-argument function into a chain of single-argument functions",
          "Combining multiple functions into one",
          "Caching the result of a function",
          "Running functions asynchronously",
        ],
        correctAnswer: "Converting a multi-argument function into a chain of single-argument functions",
      },
    ],
    2: [
      {
        id: "q1", text: "What is tree shaking in JavaScript bundlers?",
        options: ["Sorting the dependency tree", "Removing unused code from the final bundle", "Splitting code into chunks", "Minifying CSS files"],
        correctAnswer: "Removing unused code from the final bundle",
      },
      {
        id: "q2", text: "What is the purpose of Web Workers?",
        options: ["To access the DOM faster", "To run JavaScript off the main thread", "To make HTTP requests", "To manage service workers"],
        correctAnswer: "To run JavaScript off the main thread",
      },
      {
        id: "q3", text: "What does dynamic import() return?",
        options: ["The module directly", "A Promise that resolves to the module", "A string path", "A callback function"],
        correctAnswer: "A Promise that resolves to the module",
      },
    ],
  },

  "typescript-in-depth": {
    0: [
      {
        id: "q1", text: "What is the difference between 'any' and 'unknown' in TypeScript?",
        options: [
          "They are the same",
          "'unknown' requires a type check before use, 'any' does not",
          "'any' is stricter than 'unknown'",
          "'unknown' disables type checking entirely",
        ],
        correctAnswer: "'unknown' requires a type check before use, 'any' does not",
      },
      {
        id: "q2", text: "Which TypeScript type represents a value that never occurs?",
        options: ["void", "null", "undefined", "never"],
        correctAnswer: "never",
      },
      {
        id: "q3", text: "What does the 'readonly' modifier do in TypeScript?",
        options: ["Makes a property optional", "Prevents a property from being reassigned", "Makes a property private", "Removes a property from the type"],
        correctAnswer: "Prevents a property from being reassigned",
      },
    ],
    1: [
      {
        id: "q1", text: "What is a generic in TypeScript?",
        options: [
          "A built-in type",
          "A placeholder type that is defined when the function or class is used",
          "A type that accepts only strings",
          "A way to ignore type errors",
        ],
        correctAnswer: "A placeholder type that is defined when the function or class is used",
      },
      {
        id: "q2", text: "What does the Partial<T> utility type do?",
        options: ["Makes all properties required", "Makes all properties readonly", "Makes all properties optional", "Removes all properties"],
        correctAnswer: "Makes all properties optional",
      },
      {
        id: "q3", text: "What is a mapped type in TypeScript?",
        options: [
          "A type that maps strings to numbers",
          "A type that transforms every key of an existing type",
          "A type used in arrays only",
          "A shorthand for Record<string, any>",
        ],
        correctAnswer: "A type that transforms every key of an existing type",
      },
      {
        id: "q4", text: "What does the 'infer' keyword do in conditional types?",
        options: ["Forces type inference off", "Extracts a type variable from within a conditional type", "Declares a new interface", "Converts runtime values to types"],
        correctAnswer: "Extracts a type variable from within a conditional type",
      },
    ],
    2: [
      {
        id: "q1", text: "How do you type a React functional component's props in TypeScript?",
        options: ["Using PropTypes", "Using an interface or type alias passed as a generic to FC<>", "Using any", "Props are automatically typed"],
        correctAnswer: "Using an interface or type alias passed as a generic to FC<>",
      },
      {
        id: "q2", text: "What is declaration merging in TypeScript?",
        options: [
          "Combining two JS files into one",
          "Merging multiple declarations of the same name into a single definition",
          "Removing duplicate types",
          "Auto-importing missing types",
        ],
        correctAnswer: "Merging multiple declarations of the same name into a single definition",
      },
      {
        id: "q3", text: "What does Zod provide on top of TypeScript types?",
        options: ["Faster compilation", "Runtime schema validation", "Better IDE support", "Auto-generated API docs"],
        correctAnswer: "Runtime schema validation",
      },
    ],
  },

  "react-complete-guide": {
    0: [
      {
        id: "q1", text: "What hook is used to add local state to a functional component?",
        options: ["useEffect", "useRef", "useState", "useContext"],
        correctAnswer: "useState",
      },
      {
        id: "q2", text: "When does useEffect run by default?",
        options: ["Only on mount", "Only on unmount", "After every render", "Never automatically"],
        correctAnswer: "After every render",
      },
      {
        id: "q3", text: "What is the purpose of the dependency array in useEffect?",
        options: ["To list imports", "To control when the effect re-runs", "To declare state variables", "To memoize the component"],
        correctAnswer: "To control when the effect re-runs",
      },
    ],
    1: [
      {
        id: "q1", text: "What does useReducer provide over useState?",
        options: ["Faster re-renders", "Better for complex state logic with multiple sub-values", "Automatic persistence", "Global state by default"],
        correctAnswer: "Better for complex state logic with multiple sub-values",
      },
      {
        id: "q2", text: "What problem does React Query (TanStack Query) solve?",
        options: ["Component styling", "Server state management, caching, and background refetching", "Routing between pages", "Form validation"],
        correctAnswer: "Server state management, caching, and background refetching",
      },
      {
        id: "q3", text: "What is an optimistic update?",
        options: [
          "Updating the UI after server confirms",
          "Updating the UI immediately before server confirms",
          "Skipping the server entirely",
          "Caching the previous state",
        ],
        correctAnswer: "Updating the UI immediately before server confirms",
      },
    ],
    2: [
      {
        id: "q1", text: "What does React.lazy() enable?",
        options: ["Lazy state initialization", "Code splitting by loading components only when needed", "Delayed useEffect execution", "Memoizing expensive components"],
        correctAnswer: "Code splitting by loading components only when needed",
      },
      {
        id: "q2", text: "What is a React Portal used for?",
        options: [
          "Navigating between routes",
          "Rendering children outside the parent DOM hierarchy",
          "Creating context providers",
          "Sharing state between siblings",
        ],
        correctAnswer: "Rendering children outside the parent DOM hierarchy",
      },
      {
        id: "q3", text: "What does the React DevTools Profiler help you identify?",
        options: ["Network errors", "Slow components and wasted re-renders", "Missing props", "TypeScript errors"],
        correctAnswer: "Slow components and wasted re-renders",
      },
      {
        id: "q4", text: "What is the Compound Components pattern?",
        options: [
          "Nesting components randomly",
          "A pattern where a parent shares implicit state with child components for flexible APIs",
          "Combining two components into one file",
          "Using multiple context providers",
        ],
        correctAnswer: "A pattern where a parent shares implicit state with child components for flexible APIs",
      },
    ],
  },

  "nextjs-production": {
    0: [
      {
        id: "q1", text: "What is the key difference between Server Components and Client Components in Next.js?",
        options: [
          "Server Components run in the browser",
          "Client Components have no JavaScript",
          "Server Components run on the server and don't send JS to the client",
          "They are identical",
        ],
        correctAnswer: "Server Components run on the server and don't send JS to the client",
      },
      {
        id: "q2", text: "What file defines shared UI for a segment and its children in the App Router?",
        options: ["page.tsx", "layout.tsx", "template.tsx", "root.tsx"],
        correctAnswer: "layout.tsx",
      },
      {
        id: "q3", text: "What does generateStaticParams() do in Next.js?",
        options: [
          "Generates random route params",
          "Defines dynamic route segments to be statically generated at build time",
          "Validates URL parameters",
          "Creates API route handlers",
        ],
        correctAnswer: "Defines dynamic route segments to be statically generated at build time",
      },
    ],
    1: [
      {
        id: "q1", text: "What cache option makes a Next.js fetch request always get fresh data?",
        options: ["force-cache", "no-store", "revalidate: 0", "cache: false"],
        correctAnswer: "no-store",
      },
      {
        id: "q2", text: "What are Server Actions in Next.js?",
        options: [
          "Functions that run in Web Workers",
          "Server-side functions that can be called directly from Client Components",
          "Middleware functions",
          "API routes with special syntax",
        ],
        correctAnswer: "Server-side functions that can be called directly from Client Components",
      },
      {
        id: "q3", text: "What is Incremental Static Regeneration (ISR)?",
        options: [
          "Rebuilding the entire site on every request",
          "Revalidating and regenerating static pages after a specified time or on demand",
          "Generating pages only on first visit",
          "A caching strategy for API routes only",
        ],
        correctAnswer: "Revalidating and regenerating static pages after a specified time or on demand",
      },
    ],
    2: [
      {
        id: "q1", text: "What prefix makes a Next.js environment variable available in the browser?",
        options: ["PUBLIC_", "CLIENT_", "NEXT_PUBLIC_", "BROWSER_"],
        correctAnswer: "NEXT_PUBLIC_",
      },
      {
        id: "q2", text: "Which Core Web Vital measures visual stability of a page?",
        options: ["LCP", "FID", "CLS", "TTFB"],
        correctAnswer: "CLS",
      },
      {
        id: "q3", text: "Where does Next.js Middleware run?",
        options: ["In the browser", "On the Node.js server only", "At the Edge before the request reaches the server", "Inside React components"],
        correctAnswer: "At the Edge before the request reaches the server",
      },
    ],
  },

  "node-rest-apis": {
    0: [
      {
        id: "q1", text: "What makes Node.js non-blocking?",
        options: ["Multiple CPU cores", "The event loop and asynchronous I/O via libuv", "Multithreading", "In-memory caching"],
        correctAnswer: "The event loop and asynchronous I/O via libuv",
      },
      {
        id: "q2", text: "What HTTP status code indicates a resource was successfully created?",
        options: ["200", "201", "204", "301"],
        correctAnswer: "201",
      },
      {
        id: "q3", text: "Which Express method registers a global middleware?",
        options: ["app.route()", "app.use()", "app.get()", "app.set()"],
        correctAnswer: "app.use()",
      },
    ],
    1: [
      {
        id: "q1", text: "Why is bcrypt preferred over MD5 for password hashing?",
        options: [
          "MD5 is deprecated",
          "bcrypt is intentionally slow and includes salting, making brute-force attacks harder",
          "bcrypt stores passwords in plain text",
          "MD5 requires a database",
        ],
        correctAnswer: "bcrypt is intentionally slow and includes salting, making brute-force attacks harder",
      },
      {
        id: "q2", text: "What is the purpose of a JWT refresh token?",
        options: [
          "To store user data",
          "To obtain a new access token without re-logging in",
          "To encrypt the access token",
          "To log the user out",
        ],
        correctAnswer: "To obtain a new access token without re-logging in",
      },
      {
        id: "q3", text: "What does Helmet.js do in an Express app?",
        options: ["Validates request bodies", "Sets security-related HTTP response headers", "Handles file uploads", "Manages sessions"],
        correctAnswer: "Sets security-related HTTP response headers",
      },
      {
        id: "q4", text: "What is RBAC?",
        options: ["A database pattern", "Role-Based Access Control — granting permissions based on user roles", "A REST API convention", "A JWT signing algorithm"],
        correctAnswer: "Role-Based Access Control — granting permissions based on user roles",
      },
    ],
    2: [
      {
        id: "q1", text: "What does prisma.$transaction() ensure?",
        options: ["Faster queries", "All operations succeed or all are rolled back atomically", "Automatic pagination", "Connection pooling"],
        correctAnswer: "All operations succeed or all are rolled back atomically",
      },
      {
        id: "q2", text: "What is the advantage of cursor-based pagination over offset-based?",
        options: [
          "Simpler to implement",
          "Works correctly when data is inserted or deleted between pages",
          "Returns more results per page",
          "Requires no database index",
        ],
        correctAnswer: "Works correctly when data is inserted or deleted between pages",
      },
      {
        id: "q3", text: "What does Supertest allow you to do?",
        options: ["Generate API documentation", "Make HTTP requests to an Express app in tests without starting a real server", "Validate OpenAPI schemas", "Mock databases"],
        correctAnswer: "Make HTTP requests to an Express app in tests without starting a real server",
      },
    ],
  },

  "postgresql-mastery": {
    0: [
      {
        id: "q1", text: "What does ACID stand for in databases?",
        options: [
          "Atomic, Consistent, Isolated, Durable",
          "Accurate, Complete, Indexed, Defined",
          "Asynchronous, Cached, Indexed, Distributed",
          "Available, Consistent, Isolated, Durable",
        ],
        correctAnswer: "Atomic, Consistent, Isolated, Durable",
      },
      {
        id: "q2", text: "What does a FOREIGN KEY constraint enforce?",
        options: ["Uniqueness of values", "Referential integrity between tables", "Not-null values", "Default values"],
        correctAnswer: "Referential integrity between tables",
      },
      {
        id: "q3", text: "What is the purpose of database normalization?",
        options: ["To speed up queries", "To eliminate data redundancy and improve data integrity", "To add indexes", "To partition tables"],
        correctAnswer: "To eliminate data redundancy and improve data integrity",
      },
    ],
    1: [
      {
        id: "q1", text: "What is a CTE (Common Table Expression)?",
        options: [
          "A type of index",
          "A named temporary result set defined within a query using WITH",
          "A stored procedure",
          "A table constraint",
        ],
        correctAnswer: "A named temporary result set defined within a query using WITH",
      },
      {
        id: "q2", text: "What does ROW_NUMBER() window function do?",
        options: ["Counts total rows in a table", "Assigns a unique sequential number to each row in a partition", "Removes duplicate rows", "Sorts rows randomly"],
        correctAnswer: "Assigns a unique sequential number to each row in a partition",
      },
      {
        id: "q3", text: "What is JSONB in PostgreSQL?",
        options: [
          "A binary format for JSON that supports indexing and querying",
          "A JSON library for Node.js",
          "A way to store files",
          "A type of foreign key",
        ],
        correctAnswer: "A binary format for JSON that supports indexing and querying",
      },
    ],
    2: [
      {
        id: "q1", text: "What does EXPLAIN ANALYZE do in PostgreSQL?",
        options: ["Fixes slow queries automatically", "Shows the actual execution plan with real timing and row counts", "Creates a new index", "Exports query results"],
        correctAnswer: "Shows the actual execution plan with real timing and row counts",
      },
      {
        id: "q2", text: "When does PostgreSQL use a sequential scan instead of an index?",
        options: [
          "Always on large tables",
          "When the planner estimates it's cheaper, e.g. fetching a large percentage of rows",
          "When the table has no primary key",
          "When ANALYZE hasn't been run",
        ],
        correctAnswer: "When the planner estimates it's cheaper, e.g. fetching a large percentage of rows",
      },
      {
        id: "q3", text: "What is a partial index?",
        options: [
          "An index on half the table",
          "An index built only on rows matching a WHERE condition",
          "An index on a subset of columns",
          "A temporary index",
        ],
        correctAnswer: "An index built only on rows matching a WHERE condition",
      },
      {
        id: "q4", text: "What does VACUUM do in PostgreSQL?",
        options: ["Drops unused tables", "Reclaims storage from dead rows and prevents transaction ID wraparound", "Compresses indexes", "Resets sequences"],
        correctAnswer: "Reclaims storage from dead rows and prevents transaction ID wraparound",
      },
    ],
  },

  "docker-and-containers": {
    0: [
      {
        id: "q1", text: "What is the key difference between a Docker image and a container?",
        options: [
          "They are the same thing",
          "An image is a read-only template; a container is a running instance of an image",
          "A container is stored on disk; an image runs in memory",
          "Images are only used in production",
        ],
        correctAnswer: "An image is a read-only template; a container is a running instance of an image",
      },
      {
        id: "q2", text: "What does the COPY instruction do in a Dockerfile?",
        options: ["Copies files between containers", "Copies files from the host into the image", "Downloads files from the internet", "Copies environment variables"],
        correctAnswer: "Copies files from the host into the image",
      },
      {
        id: "q3", text: "What is Docker layer caching?",
        options: [
          "Storing container logs",
          "Reusing unchanged image layers from previous builds to speed up builds",
          "Caching HTTP responses inside containers",
          "Saving container state to disk",
        ],
        correctAnswer: "Reusing unchanged image layers from previous builds to speed up builds",
      },
    ],
    1: [
      {
        id: "q1", text: "What does the 'depends_on' field in docker-compose.yml do?",
        options: ["Shares volumes between services", "Controls service startup order", "Links environment variables", "Sets resource limits"],
        correctAnswer: "Controls service startup order",
      },
      {
        id: "q2", text: "What is the difference between a named volume and a bind mount?",
        options: [
          "They are identical",
          "Named volumes are managed by Docker; bind mounts link to a specific host directory",
          "Bind mounts are managed by Docker; named volumes link to a host directory",
          "Named volumes are temporary",
        ],
        correctAnswer: "Named volumes are managed by Docker; bind mounts link to a specific host directory",
      },
      {
        id: "q3", text: "How do containers in the same Docker network communicate?",
        options: ["Via the host machine IP", "Using their service name as a hostname", "Only via exposed ports", "Via shared environment variables"],
        correctAnswer: "Using their service name as a hostname",
      },
    ],
    2: [
      {
        id: "q1", text: "What is the benefit of a multi-stage Docker build?",
        options: [
          "Faster container startup",
          "Separating build dependencies from the final image, resulting in a smaller and more secure image",
          "Running multiple services in one container",
          "Sharing layers between different images",
        ],
        correctAnswer: "Separating build dependencies from the final image, resulting in a smaller and more secure image",
      },
      {
        id: "q2", text: "Why should containers run as a non-root user?",
        options: ["To improve performance", "To limit the damage if the container is compromised", "To allow more network connections", "Root is not available in containers"],
        correctAnswer: "To limit the damage if the container is compromised",
      },
      {
        id: "q3", text: "What does Docker image scanning with Trivy detect?",
        options: ["Unused layers", "Known CVEs and vulnerabilities in image dependencies", "Performance bottlenecks", "Misconfigured Dockerfiles"],
        correctAnswer: "Known CVEs and vulnerabilities in image dependencies",
      },
    ],
  },

  "git-and-github": {
    0: [
      {
        id: "q1", text: "What are the three areas in Git's data model?",
        options: [
          "Remote, local, cloud",
          "Working directory, staging area, repository",
          "HEAD, branch, tag",
          "Commit, push, pull",
        ],
        correctAnswer: "Working directory, staging area, repository",
      },
      {
        id: "q2", text: "What does 'git stash' do?",
        options: ["Deletes uncommitted changes", "Temporarily saves uncommitted changes so you can switch branches", "Commits changes with a temporary message", "Syncs with remote"],
        correctAnswer: "Temporarily saves uncommitted changes so you can switch branches",
      },
      {
        id: "q3", text: "What is the purpose of a .gitignore file?",
        options: ["To list collaborators", "To specify files and directories Git should not track", "To store git credentials", "To define branch rules"],
        correctAnswer: "To specify files and directories Git should not track",
      },
    ],
    1: [
      {
        id: "q1", text: "What is the golden rule of git rebase?",
        options: [
          "Always rebase before merging",
          "Never rebase commits that have been pushed to a shared branch",
          "Rebase is always better than merge",
          "Only rebase on main",
        ],
        correctAnswer: "Never rebase commits that have been pushed to a shared branch",
      },
      {
        id: "q2", text: "What does an interactive rebase allow you to do?",
        options: ["Push to multiple remotes", "Edit, squash, reorder, or drop commits in history", "Merge branches automatically", "Fetch remote changes"],
        correctAnswer: "Edit, squash, reorder, or drop commits in history",
      },
      {
        id: "q3", text: "What does git cherry-pick do?",
        options: ["Selects the best branch to merge", "Applies a specific commit from one branch onto another", "Removes a commit from history", "Creates a new branch from a commit"],
        correctAnswer: "Applies a specific commit from one branch onto another",
      },
      {
        id: "q4", text: "What is git reflog used for?",
        options: ["Viewing remote logs", "Recovering lost commits and branches by viewing all HEAD movements", "Filtering commit history", "Showing file change history"],
        correctAnswer: "Recovering lost commits and branches by viewing all HEAD movements",
      },
    ],
    2: [
      {
        id: "q1", text: "What is a branch protection rule on GitHub?",
        options: [
          "A rule that prevents branch creation",
          "A setting that enforces required reviews or status checks before merging",
          "A way to encrypt branch contents",
          "A rule that auto-deletes merged branches",
        ],
        correctAnswer: "A setting that enforces required reviews or status checks before merging",
      },
      {
        id: "q2", text: "What triggers a GitHub Actions workflow?",
        options: ["Only manual runs", "Events like push, pull_request, schedule, or workflow_dispatch", "Only on main branch", "Only on tagged releases"],
        correctAnswer: "Events like push, pull_request, schedule, or workflow_dispatch",
      },
      {
        id: "q3", text: "How should secrets like API keys be stored in GitHub Actions?",
        options: ["Hardcoded in the workflow file", "In a .env file committed to the repo", "In GitHub Secrets, accessed via ${{ secrets.NAME }}", "In the README"],
        correctAnswer: "In GitHub Secrets, accessed via ${{ secrets.NAME }}",
      },
    ],
  },

  "system-design-fundamentals": {
    0: [
      {
        id: "q1", text: "What does the CAP theorem state?",
        options: [
          "A distributed system can guarantee all three: Consistency, Availability, and Partition tolerance",
          "A distributed system can guarantee at most two of: Consistency, Availability, and Partition tolerance",
          "Consistency is always more important than Availability",
          "Partition tolerance is optional in modern systems",
        ],
        correctAnswer: "A distributed system can guarantee at most two of: Consistency, Availability, and Partition tolerance",
      },
      {
        id: "q2", text: "What is the difference between L4 and L7 load balancers?",
        options: [
          "L4 is faster; L7 is slower",
          "L4 routes based on TCP/UDP; L7 routes based on HTTP content like headers and URLs",
          "L7 handles more connections than L4",
          "They are identical in function",
        ],
        correctAnswer: "L4 routes based on TCP/UDP; L7 routes based on HTTP content like headers and URLs",
      },
      {
        id: "q3", text: "What is an SLO?",
        options: [
          "A software license obligation",
          "A Service Level Objective — a specific measurable reliability target",
          "A type of load balancer",
          "A server location option",
        ],
        correctAnswer: "A Service Level Objective — a specific measurable reliability target",
      },
    ],
    1: [
      {
        id: "q1", text: "What is the cache-aside pattern?",
        options: [
          "The cache is always written to first",
          "The application checks the cache first; on a miss, it loads from the database and populates the cache",
          "The database writes directly to the cache",
          "The cache is invalidated on every read",
        ],
        correctAnswer: "The application checks the cache first; on a miss, it loads from the database and populates the cache",
      },
      {
        id: "q2", text: "What is database sharding?",
        options: [
          "Backing up a database",
          "Horizontally partitioning data across multiple database instances",
          "Replicating a database to a read replica",
          "Compressing database tables",
        ],
        correctAnswer: "Horizontally partitioning data across multiple database instances",
      },
      {
        id: "q3", text: "Why is cache invalidation considered hard?",
        options: [
          "Caches are slow to write to",
          "Knowing exactly when cached data becomes stale and needs updating is complex",
          "Most databases don't support cache invalidation",
          "It requires a restart of the cache server",
        ],
        correctAnswer: "Knowing exactly when cached data becomes stale and needs updating is complex",
      },
      {
        id: "q4", text: "What is a leader-follower replication setup?",
        options: [
          "Multiple databases writing simultaneously",
          "One primary database accepts writes; replicas sync and serve reads",
          "A backup database that only activates on failure",
          "Sharding across geographic regions",
        ],
        correctAnswer: "One primary database accepts writes; replicas sync and serve reads",
      },
    ],
    2: [
      {
        id: "q1", text: "What is the main tradeoff of microservices over a monolith?",
        options: [
          "Microservices are always faster",
          "Microservices offer independent scalability and deployment at the cost of distributed system complexity",
          "Monoliths can't scale at all",
          "Microservices have no tradeoffs",
        ],
        correctAnswer: "Microservices offer independent scalability and deployment at the cost of distributed system complexity",
      },
      {
        id: "q2", text: "What is the outbox pattern used for?",
        options: [
          "Storing failed emails",
          "Ensuring database writes and event publishing happen atomically without two-phase commit",
          "Routing messages between services",
          "Backing up message queues",
        ],
        correctAnswer: "Ensuring database writes and event publishing happen atomically without two-phase commit",
      },
      {
        id: "q3", text: "What does a circuit breaker pattern do in microservices?",
        options: [
          "Encrypts service communication",
          "Stops making calls to a failing service to prevent cascading failures",
          "Balances load between services",
          "Monitors CPU usage",
        ],
        correctAnswer: "Stops making calls to a failing service to prevent cascading failures",
      },
    ],
  },
};

// ─── Drag-drop configs per course and section ─────────────────────────────────
const COURSE_DRAG_DROP = {
  "python-for-beginners": {
    0: { prompt: "Match each Python concept to its category.", pairs: [{ item: "def", target: "Functions" }, { item: "str", target: "Data Types" }, { item: "print()", target: "Built-ins" }] },
    1: { prompt: "Match each loop control keyword to its behaviour.", pairs: [{ item: "break", target: "Exit loop" }, { item: "continue", target: "Skip iteration" }, { item: "pass", target: "Do nothing" }] },
    2: { prompt: "Match each built-in function to what it returns.", pairs: [{ item: "len()", target: "Item count" }, { item: "sorted()", target: "Sorted list" }, { item: "type()", target: "Data type" }] },
  },
  "javascript-fundamentals": {
    0: { prompt: "Match each JS keyword to its scoping rule.", pairs: [{ item: "var", target: "Function scoped" }, { item: "let", target: "Block scoped" }, { item: "const", target: "Block scoped + immutable binding" }] },
    1: { prompt: "Match each array method to its purpose.", pairs: [{ item: "map()", target: "Transform elements" }, { item: "filter()", target: "Select elements" }, { item: "reduce()", target: "Accumulate value" }] },
    2: { prompt: "Match each async concept to its description.", pairs: [{ item: "Promise", target: "Represents future value" }, { item: "async/await", target: "Syntactic sugar over promises" }, { item: "fetch()", target: "Makes HTTP requests" }] },
  },
  "react-complete-guide": {
    0: { prompt: "Match each React hook to its primary use.", pairs: [{ item: "useState", target: "Local state" }, { item: "useEffect", target: "Side effects" }, { item: "useRef", target: "DOM reference" }] },
    1: { prompt: "Match each state management tool to its scope.", pairs: [{ item: "useState", target: "Component level" }, { item: "Context API", target: "App level" }, { item: "Zustand", target: "Global store" }] },
    2: { prompt: "Match each performance technique to what it optimises.", pairs: [{ item: "React.lazy()", target: "Bundle size" }, { item: "useMemo()", target: "Expensive computation" }, { item: "useCallback()", target: "Function reference" }] },
  },
  "postgresql-mastery": {
    0: { prompt: "Match each SQL command to its category.", pairs: [{ item: "SELECT", target: "DQL" }, { item: "INSERT", target: "DML" }, { item: "CREATE TABLE", target: "DDL" }] },
    1: { prompt: "Match each window function to its purpose.", pairs: [{ item: "ROW_NUMBER()", target: "Unique row rank" }, { item: "LAG()", target: "Previous row value" }, { item: "SUM() OVER()", target: "Running total" }] },
    2: { prompt: "Match each index type to its best use case.", pairs: [{ item: "B-Tree", target: "Equality and range queries" }, { item: "GIN", target: "Full-text search" }, { item: "Partial index", target: "Filtered subset of rows" }] },
  },
  "docker-and-containers": {
    0: { prompt: "Match each Dockerfile instruction to its purpose.", pairs: [{ item: "FROM", target: "Base image" }, { item: "COPY", target: "Add files" }, { item: "CMD", target: "Default command" }] },
    1: { prompt: "Match each docker-compose concept to its role.", pairs: [{ item: "volumes", target: "Persist data" }, { item: "networks", target: "Service communication" }, { item: "depends_on", target: "Startup order" }] },
    2: { prompt: "Match each security practice to its benefit.", pairs: [{ item: "Non-root user", target: "Limit breach damage" }, { item: "Multi-stage build", target: "Smaller image" }, { item: "Image scanning", target: "Detect CVEs" }] },
  },
  "git-and-github": {
    0: { prompt: "Match each Git area to where files live.", pairs: [{ item: "Working directory", target: "Untracked changes" }, { item: "Staging area", target: "Ready to commit" }, { item: "Repository", target: "Committed history" }] },
    1: { prompt: "Match each rebase operation to what it does.", pairs: [{ item: "squash", target: "Merge commits" }, { item: "reword", target: "Edit commit message" }, { item: "drop", target: "Remove commit" }] },
    2: { prompt: "Match each GitHub feature to its purpose.", pairs: [{ item: "Branch protection", target: "Enforce review rules" }, { item: "GitHub Actions", target: "CI/CD automation" }, { item: "GitHub Secrets", target: "Store credentials safely" }] },
  },
  "node-rest-apis": {
    0: { prompt: "Match each HTTP method to its REST operation.", pairs: [{ item: "GET", target: "Read" }, { item: "POST", target: "Create" }, { item: "DELETE", target: "Remove" }] },
    1: { prompt: "Match each auth concept to its purpose.", pairs: [{ item: "bcrypt", target: "Hash passwords" }, { item: "Access token", target: "Short-lived auth" }, { item: "Refresh token", target: "Obtain new access token" }] },
    2: { prompt: "Match each Prisma concept to its role.", pairs: [{ item: "schema.prisma", target: "Define models" }, { item: "migrate dev", target: "Apply migrations" }, { item: "$transaction()", target: "Atomic operations" }] },
  },
  "system-design-fundamentals": {
    0: { prompt: "Match each scaling strategy to its approach.", pairs: [{ item: "Vertical scaling", target: "Bigger machine" }, { item: "Horizontal scaling", target: "More machines" }, { item: "CDN", target: "Edge caching" }] },
    1: { prompt: "Match each storage type to its best use case.", pairs: [{ item: "PostgreSQL", target: "Relational structured data" }, { item: "Redis", target: "Fast ephemeral cache" }, { item: "S3", target: "Blob / file storage" }] },
    2: { prompt: "Match each microservice pattern to its purpose.", pairs: [{ item: "API Gateway", target: "Single entry point" }, { item: "Message queue", target: "Async decoupling" }, { item: "Circuit breaker", target: "Fault tolerance" }] },
  },
};

// Default fallbacks for courses not explicitly listed above
const DEFAULT_DRAG_DROP = (sectionTitle) => ({
  prompt: `Match each concept from "${sectionTitle}" to its correct category.`,
  pairs: [
    { item: "Declare", target: "Setup" },
    { item: "Execute", target: "Runtime" },
    { item: "Validate", target: "Quality" },
  ],
});

const DEFAULT_QUIZ = (courseTitle, sectionTitle) => ([
  {
    id: "q1",
    text: `Which practice leads to the most maintainable ${courseTitle} code?`,
    options: ["Small, focused functions", "Large monolithic files", "No comments at all", "Hard-coded values"],
    correctAnswer: "Small, focused functions",
  },
  {
    id: "q2",
    text: `In the context of "${sectionTitle}", what should you do first?`,
    options: ["Plan your approach", "Write code immediately", "Skip documentation", "Ignore edge cases"],
    correctAnswer: "Plan your approach",
  },
  {
    id: "q3",
    text: "What should you do when a test fails unexpectedly?",
    options: ["Investigate the root cause", "Delete the test", "Ignore it", "Revert all recent changes"],
    correctAnswer: "Investigate the root cause",
  },
]);

// ─── Code challenge and fill-blank configs (generic but named per course) ──────
const makeCodeChallengeConfig = (courseTitle) => ({
  instructions: `Apply what you learned in ${courseTitle} to implement the function below. Focus on correctness first, then readability.`,
  starterCode: `// Your solution here\nfunction solve(input) {\n  // implement this\n}`,
  testCases: [
    { id: "t1", description: "Returns correct result for valid input" },
    { id: "t2", description: "Handles edge cases without throwing" },
    { id: "t3", description: "Produces output in the expected format" },
  ],
});

const makeFillBlankConfig = (sectionTitle) => ({
  template: `When working with "${sectionTitle}", you should always <_> your inputs and write <_> tests to verify your implementation.`,
  blanks: [
    { id: "b1", correctAnswer: "validate" },
    { id: "b2", correctAnswer: "automated" },
  ],
});

// ─── Course blueprints ────────────────────────────────────────────────────────
const COURSE_BLUEPRINTS = [
  {
    slug: "python-for-beginners",
    title: "Python for Beginners",
    description: "Start coding with Python — the world's most beginner-friendly language. Learn variables, loops, functions, and real project patterns from scratch.",
    difficulty: "beginner",
    tags: ["python", "programming", "beginner"],
    videoTopic: "python",
    sections: [
      {
        title: "Getting Started with Python",
        description: "Set up your environment and write your first Python programs.",
        lessons: [
          { title: "What is Python and Why Learn It", summary: "Overview of Python and its use cases." },
          { title: "Installing Python and VS Code", summary: "Step-by-step setup on Windows, Mac, and Linux." },
          { title: "Your First Python Script", summary: "Hello World and running scripts in the terminal." },
          { title: "Variables and Data Types", summary: "Strings, integers, floats, and booleans." },
          { title: "Taking User Input", summary: "Reading input with input() and converting types." },
          { title: "String Formatting with f-strings", summary: "Clean string interpolation in Python 3." },
          { title: "Python Comments and Code Style", summary: "PEP 8 basics and writing readable code." },
          { title: "Section 1 Summary and Quiz Prep", summary: "Review article covering all section 1 concepts." },
        ],
      },
      {
        title: "Control Flow and Loops",
        description: "Make decisions and repeat actions in your programs.",
        lessons: [
          { title: "if, elif, and else Statements", summary: "Conditional branching in Python." },
          { title: "Comparison and Logical Operators", summary: "==, !=, and, or, not explained." },
          { title: "The while Loop", summary: "Repeat code while a condition is true." },
          { title: "The for Loop and range()", summary: "Iterating over sequences and ranges." },
          { title: "break, continue, and pass", summary: "Controlling loop execution flow." },
          { title: "Nested Loops", summary: "Loops inside loops — when and how to use them." },
          { title: "List Comprehensions", summary: "A Pythonic shortcut for building lists." },
          { title: "Practice: Build a Number Guessing Game", summary: "Hands-on project using all loop concepts." },
        ],
      },
      {
        title: "Functions and Modules",
        description: "Write reusable code and organize your programs properly.",
        lessons: [
          { title: "Defining and Calling Functions", summary: "def, parameters, and return values." },
          { title: "Default and Keyword Arguments", summary: "Flexible function signatures." },
          { title: "Variable Scope: Local vs Global", summary: "Understanding where variables live." },
          { title: "Lambda Functions", summary: "Inline anonymous functions in Python." },
          { title: "Built-in Functions You Need", summary: "len, sorted, map, filter, zip, enumerate." },
          { title: "Importing Standard Library Modules", summary: "Using math, random, os, and datetime." },
          { title: "Creating Your Own Modules", summary: "Splitting code into importable files." },
          { title: "Project: Command-Line Calculator", summary: "A full mini-project tying functions together." },
        ],
      },
    ],
  },
  {
    slug: "python-data-science",
    title: "Python for Data Science",
    description: "Analyse data, build visualisations, and train your first machine learning models using Python, pandas, matplotlib, and scikit-learn.",
    difficulty: "intermediate",
    tags: ["python", "data-science", "machine-learning", "pandas"],
    videoTopic: "python",
    sections: [
      {
        title: "NumPy and pandas Essentials",
        description: "The numerical and tabular data foundations for all data science work.",
        lessons: [
          { title: "Why NumPy? Arrays vs Lists", summary: "Performance and vectorised operations." },
          { title: "Creating and Slicing NumPy Arrays", summary: "Indexing, reshaping, and broadcasting." },
          { title: "Introduction to pandas DataFrames", summary: "Tabular data structures and creation methods." },
          { title: "Loading CSV and JSON Data", summary: "pd.read_csv, read_json, and handling encodings." },
          { title: "Selecting, Filtering, and Sorting Data", summary: "loc, iloc, boolean indexing." },
          { title: "Handling Missing Values", summary: "dropna, fillna, and interpolation strategies." },
          { title: "GroupBy and Aggregation", summary: "Summarising data by category." },
          { title: "Merging and Joining DataFrames", summary: "merge, join, and concat explained." },
        ],
      },
      {
        title: "Data Visualisation",
        description: "Turn raw data into clear, compelling charts.",
        lessons: [
          { title: "Matplotlib Fundamentals", summary: "Figure, axes, and the anatomy of a plot." },
          { title: "Line, Bar, and Scatter Plots", summary: "Choosing the right chart for your data." },
          { title: "Histograms and Box Plots", summary: "Visualising distributions and outliers." },
          { title: "Subplots and Figure Layout", summary: "Multiple charts in one figure." },
          { title: "Seaborn for Statistical Plots", summary: "heatmaps, violin plots, pairplots." },
          { title: "Customising Style and Themes", summary: "Colours, fonts, and publication-ready charts." },
          { title: "Plotting Directly from pandas", summary: "df.plot() shortcuts and integration." },
          { title: "Project: Exploratory Data Analysis Report", summary: "End-to-end EDA on a real dataset." },
        ],
      },
      {
        title: "Machine Learning with scikit-learn",
        description: "Build, evaluate, and tune your first predictive models.",
        lessons: [
          { title: "What is Machine Learning?", summary: "Supervised vs unsupervised, regression vs classification." },
          { title: "Train/Test Split and Cross-Validation", summary: "Evaluating models without overfitting." },
          { title: "Linear Regression", summary: "Predicting continuous values from features." },
          { title: "Logistic Regression for Classification", summary: "Binary and multiclass prediction." },
          { title: "Decision Trees and Random Forests", summary: "Ensemble methods and feature importance." },
          { title: "Preprocessing: Scaling and Encoding", summary: "StandardScaler, OneHotEncoder, pipelines." },
          { title: "Hyperparameter Tuning with GridSearchCV", summary: "Finding the best model configuration." },
          { title: "Project: Predict Housing Prices End-to-End", summary: "Full ML pipeline from raw data to submission." },
        ],
      },
    ],
  },
  {
    slug: "javascript-fundamentals",
    title: "JavaScript Fundamentals",
    description: "The definitive beginner course for JavaScript — learn the language of the web from variables to async/await, with hands-on exercises throughout.",
    difficulty: "beginner",
    tags: ["javascript", "web", "frontend", "beginner"],
    videoTopic: "javascript",
    sections: [
      {
        title: "Core JavaScript Syntax",
        description: "Everything you need to write and run JavaScript confidently.",
        lessons: [
          { title: "How JavaScript Runs in the Browser", summary: "The JS engine, the event loop, and the console." },
          { title: "Variables: var, let, and const", summary: "Scoping rules and when to use each." },
          { title: "Primitive Data Types", summary: "string, number, boolean, null, undefined, symbol." },
          { title: "Operators and Expressions", summary: "Arithmetic, comparison, logical, and ternary." },
          { title: "Template Literals", summary: "Multi-line strings and embedded expressions." },
          { title: "Type Coercion and Equality", summary: "== vs === and implicit conversions." },
          { title: "Functions: Declarations vs Expressions", summary: "Hoisting and function scope." },
          { title: "Arrow Functions", summary: "Syntax, implicit return, and lexical this." },
        ],
      },
      {
        title: "Arrays, Objects, and Iteration",
        description: "Work with collections and complex data structures.",
        lessons: [
          { title: "Creating and Accessing Arrays", summary: "Indexing, length, and common array methods." },
          { title: "Array Methods: map, filter, reduce", summary: "Functional iteration patterns." },
          { title: "Spread, Rest, and Destructuring for Arrays", summary: "Modern ES6+ syntax in practice." },
          { title: "Objects: Keys, Values, and Methods", summary: "Property access, mutation, and computed keys." },
          { title: "Object Destructuring and Shorthand", summary: "Cleaner code with destructuring patterns." },
          { title: "The for...of and for...in Loops", summary: "Iterating over arrays vs object keys." },
          { title: "Sets and Maps", summary: "When to prefer Set and Map over arrays and objects." },
          { title: "Deep Clone vs Shallow Copy", summary: "structuredClone, spread, and JSON tricks." },
        ],
      },
      {
        title: "Async JavaScript",
        description: "Master callbacks, promises, and async/await for real applications.",
        lessons: [
          { title: "The JavaScript Event Loop Visualised", summary: "Call stack, task queue, and microtasks." },
          { title: "Callbacks and Callback Hell", summary: "How async code started — and its limitations." },
          { title: "Promises: then, catch, finally", summary: "Creating and chaining promises." },
          { title: "Promise.all, Promise.race, and allSettled", summary: "Running async operations in parallel." },
          { title: "async / await Syntax", summary: "Writing async code that reads like sync code." },
          { title: "Error Handling in Async Code", summary: "try/catch with await and promise rejection." },
          { title: "Fetch API and REST Calls", summary: "Making HTTP requests from the browser." },
          { title: "Project: Weather App with a Public API", summary: "Build a live weather dashboard with fetch and async/await." },
        ],
      },
    ],
  },
  {
    slug: "advanced-javascript",
    title: "Advanced JavaScript Patterns",
    description: "Deep-dive into closures, prototypes, design patterns, performance optimisation, and the module system — everything senior JS developers live by.",
    difficulty: "advanced",
    tags: ["javascript", "advanced", "patterns", "performance"],
    videoTopic: "javascript",
    sections: [
      {
        title: "Closures, Scope, and the Prototype Chain",
        description: "Understand how JavaScript really works under the hood.",
        lessons: [
          { title: "Execution Contexts and the Call Stack", summary: "How JS creates and destroys execution contexts." },
          { title: "Closures in Depth", summary: "Lexical scope, closure creation, and memory implications." },
          { title: "IIFE Pattern and Module Encapsulation", summary: "Classic encapsulation before ES modules." },
          { title: "Prototypal Inheritance", summary: "Object.create, __proto__, and the prototype chain." },
          { title: "class Syntax vs Prototype Patterns", summary: "ES6 classes de-mystified." },
          { title: "this Keyword in Every Context", summary: "Global, object, arrow, and bound this." },
          { title: "bind, call, and apply", summary: "Explicit this binding for flexible functions." },
          { title: "Generators and Iterators", summary: "Custom iteration protocols with function*." },
        ],
      },
      {
        title: "Design Patterns in JavaScript",
        description: "Apply proven solutions to common programming problems.",
        lessons: [
          { title: "Observer / EventEmitter Pattern", summary: "Building reactive pub/sub systems." },
          { title: "Factory and Builder Patterns", summary: "Flexible object creation strategies." },
          { title: "Singleton Pattern", summary: "Single-instance modules and when to avoid them." },
          { title: "Strategy Pattern", summary: "Swappable algorithms for clean code." },
          { title: "Proxy and Reflect API", summary: "Intercept object operations for validation and logging." },
          { title: "Memoisation and Caching", summary: "Performance through intelligent result caching." },
          { title: "Currying and Partial Application", summary: "Composing functions for reusability." },
          { title: "Functional Composition with pipe and compose", summary: "Building data pipelines with pure functions." },
        ],
      },
      {
        title: "Performance and Modern Tooling",
        description: "Write faster code and master the modern JavaScript ecosystem.",
        lessons: [
          { title: "JavaScript Engine Optimisations (V8)", summary: "Hidden classes, inline caching, and JIT." },
          { title: "Memory Management and Leak Detection", summary: "Heap snapshots and common leak patterns." },
          { title: "Web Workers for CPU-Intensive Tasks", summary: "Running code off the main thread." },
          { title: "ES Modules: import and export in Depth", summary: "Static analysis, tree shaking, and circular deps." },
          { title: "Bundlers: Vite, esbuild, and Rollup", summary: "How modern bundlers transform your code." },
          { title: "Code Splitting and Lazy Loading", summary: "Dynamic import() and bundle strategies." },
          { title: "Performance Profiling in DevTools", summary: "Finding bottlenecks with the Performance panel." },
          { title: "Project: Build a Mini Reactive State Library", summary: "Implement a tiny Vue-like reactivity system from scratch." },
        ],
      },
    ],
  },
  {
    slug: "typescript-in-depth",
    title: "TypeScript In Depth",
    description: "Go beyond basic annotations — master generics, utility types, conditional types, and TypeScript's advanced type system for professional-grade codebases.",
    difficulty: "intermediate",
    tags: ["typescript", "javascript", "types", "dev"],
    videoTopic: "typescript",
    sections: [
      {
        title: "TypeScript Foundations",
        description: "Build a solid base with the core type system.",
        lessons: [
          { title: "Why TypeScript? The Cost of Runtime Errors", summary: "Static typing benefits with real examples." },
          { title: "Basic Types and Type Annotations", summary: "string, number, boolean, any, unknown, never." },
          { title: "Interfaces vs Type Aliases", summary: "Choosing the right construct and when to extend." },
          { title: "Union and Intersection Types", summary: "Composing types with | and &." },
          { title: "Literal Types and Type Narrowing", summary: "Using typeof, instanceof, and in guards." },
          { title: "Enums and Const Assertions", summary: "Modelling fixed sets of values safely." },
          { title: "Optional Chaining and Nullish Coalescing", summary: "Handling null and undefined gracefully." },
          { title: "tsconfig.json: Key Compiler Options", summary: "strict, moduleResolution, paths, and more." },
        ],
      },
      {
        title: "Generics and Advanced Types",
        description: "Write flexible, reusable code that is still fully type-safe.",
        lessons: [
          { title: "Introduction to Generics", summary: "Generic functions, classes, and interfaces." },
          { title: "Generic Constraints with extends", summary: "Restricting what types a generic can accept." },
          { title: "Utility Types: Partial, Required, Pick, Omit", summary: "Built-in type transformers in practice." },
          { title: "Mapped Types", summary: "Transforming every key of a type programmatically." },
          { title: "Conditional Types", summary: "T extends U ? X : Y and its real-world applications." },
          { title: "Infer Keyword", summary: "Extracting types from within conditional types." },
          { title: "Template Literal Types", summary: "String manipulation at the type level." },
          { title: "Discriminated Unions for State Machines", summary: "Type-safe state modelling with tagged unions." },
        ],
      },
      {
        title: "TypeScript in Real Projects",
        description: "Apply TypeScript professionally in React, Node, and API projects.",
        lessons: [
          { title: "Typing React Props and State", summary: "FC, ReactNode, event types, and ref typing." },
          { title: "Custom Hooks with Full Type Safety", summary: "Generics and return-type inference in hooks." },
          { title: "Typing Express Request and Response", summary: "Augmenting Express types for typed APIs." },
          { title: "Zod for Runtime Validation", summary: "Schema validation that matches your TypeScript types." },
          { title: "Declaration Files (.d.ts)", summary: "Writing and consuming type declarations." },
          { title: "Module Augmentation and Declaration Merging", summary: "Extending third-party library types." },
          { title: "Strict Mode Migration Strategy", summary: "Incrementally adopting strictNullChecks in legacy code." },
          { title: "Project: Fully-Typed REST API with Express + Zod", summary: "End-to-end typed API with validation and error handling." },
        ],
      },
    ],
  },
  {
    slug: "react-complete-guide",
    title: "React: The Complete Guide",
    description: "Build production-quality React applications — hooks, context, performance, testing, and modern patterns all in one comprehensive course.",
    difficulty: "intermediate",
    tags: ["react", "frontend", "hooks", "ui"],
    videoTopic: "react",
    sections: [
      {
        title: "React Fundamentals and Hooks",
        description: "The essential building blocks of every React application.",
        lessons: [
          { title: "What is React and How it Renders", summary: "Virtual DOM, reconciliation, and React Fiber." },
          { title: "JSX Deep Dive", summary: "Transpilation, expressions, and JSX gotchas." },
          { title: "Functional Components and Props", summary: "Component composition and prop drilling." },
          { title: "useState and Component State", summary: "State updates, batching, and re-renders." },
          { title: "useEffect: Side Effects in React", summary: "Dependencies, cleanup, and common pitfalls." },
          { title: "useRef for DOM Access and Persistent Values", summary: "Refs without triggering re-renders." },
          { title: "useCallback and useMemo", summary: "Memoisation for performance-sensitive trees." },
          { title: "Custom Hooks: Extracting Logic", summary: "Building reusable hooks for data fetching and more." },
        ],
      },
      {
        title: "State Management and Data Fetching",
        description: "Handle complex state and server data at scale.",
        lessons: [
          { title: "Context API for Global State", summary: "createContext, useContext, and avoiding over-use." },
          { title: "useReducer for Complex State Logic", summary: "Redux-style state machines inside components." },
          { title: "Data Fetching Patterns with useEffect", summary: "Loading, error, and abort patterns." },
          { title: "TanStack Query (React Query) Essentials", summary: "Server state, caching, and background refetching." },
          { title: "Zustand for Lightweight Global State", summary: "Simple store setup and devtools integration." },
          { title: "Optimistic Updates", summary: "Instant UI feedback before server confirmation." },
          { title: "Pagination and Infinite Scroll", summary: "useInfiniteQuery and intersection observer." },
          { title: "Error Boundaries", summary: "Catching render errors gracefully in the component tree." },
        ],
      },
      {
        title: "React Performance and Production Patterns",
        description: "Ship fast, maintainable React apps to production.",
        lessons: [
          { title: "React DevTools Profiler", summary: "Finding slow components and wasted renders." },
          { title: "Code Splitting with React.lazy and Suspense", summary: "Route and component-level lazy loading." },
          { title: "Virtualising Long Lists with TanStack Virtual", summary: "Render 100k rows without crashing the browser." },
          { title: "React Portals", summary: "Rendering modals and tooltips outside the DOM hierarchy." },
          { title: "Compound Components Pattern", summary: "Flexible APIs for reusable UI components." },
          { title: "Render Props and Higher-Order Components", summary: "Classic patterns still used in libraries." },
          { title: "Testing React with Vitest and Testing Library", summary: "Unit and integration testing best practices." },
          { title: "Project: Build a Full Trello Clone", summary: "Drag-and-drop kanban board with full state management." },
        ],
      },
    ],
  },
  {
    slug: "nextjs-production",
    title: "Next.js for Production",
    description: "Ship fast, SEO-ready web applications with Next.js — the App Router, Server Components, streaming, caching, and deployment to Vercel.",
    difficulty: "intermediate",
    tags: ["nextjs", "react", "fullstack", "ssr"],
    videoTopic: "react",
    sections: [
      {
        title: "Next.js App Router Fundamentals",
        description: "Understand the new mental model and file-system routing.",
        lessons: [
          { title: "Pages Router vs App Router: What Changed", summary: "Migration paths and when to choose each." },
          { title: "File-System Routing in the App Directory", summary: "page.tsx, layout.tsx, loading.tsx, error.tsx." },
          { title: "Server Components vs Client Components", summary: "The use client directive and decision tree." },
          { title: "Nested Layouts and Route Groups", summary: "Shared chrome and parallel routes." },
          { title: "Dynamic Routes and generateStaticParams", summary: "SSG with dynamic segments at build time." },
          { title: "Link Component and Navigation", summary: "Prefetching, shallow routing, and useRouter." },
          { title: "Metadata API for SEO", summary: "Generating title, description, and OpenGraph tags." },
          { title: "Image Optimisation with next/image", summary: "Responsive images, lazy loading, and AVIF/WebP." },
        ],
      },
      {
        title: "Data Fetching and Caching",
        description: "Leverage the full power of RSC data fetching strategies.",
        lessons: [
          { title: "fetch in Server Components with Cache Control", summary: "force-cache, no-store, and revalidate." },
          { title: "Streaming with Suspense", summary: "Progressive rendering and instant page shells." },
          { title: "Route Handlers (API Routes)", summary: "Building REST endpoints inside Next.js." },
          { title: "Server Actions", summary: "Calling server functions directly from client components." },
          { title: "Incremental Static Regeneration (ISR)", summary: "Revalidating pages on a schedule or on demand." },
          { title: "Parallel and Sequential Data Fetching", summary: "Promise.all vs waterfall in RSC." },
          { title: "Middleware for Auth and Redirects", summary: "Edge runtime, cookies, and request rewriting." },
          { title: "Project: Build a Blog with MDX and ISR", summary: "Full content site with static generation and live previews." },
        ],
      },
      {
        title: "Authentication, Deployment, and Performance",
        description: "Secure and ship your Next.js app to production.",
        lessons: [
          { title: "Auth with NextAuth.js (Auth.js)", summary: "OAuth providers, session strategy, and callbacks." },
          { title: "Protecting Routes with Middleware", summary: "Token verification at the edge." },
          { title: "Environment Variables and Secrets", summary: "NEXT_PUBLIC_ prefix and server-only secrets." },
          { title: "Database Integration with Prisma", summary: "Connecting Prisma to a Postgres database in Next.js." },
          { title: "Next.js Performance Metrics", summary: "LCP, CLS, FID, and Core Web Vitals tooling." },
          { title: "Deploying to Vercel", summary: "CI/CD pipeline, preview deployments, and edge config." },
          { title: "Self-Hosting on a VPS with Docker", summary: "Building a Next.js Docker image and reverse proxy setup." },
          { title: "Project: SaaS Starter — Auth, Stripe, and Dashboard", summary: "Full production app with payments, auth, and analytics." },
        ],
      },
    ],
  },
  {
    slug: "node-rest-apis",
    title: "Node.js REST APIs",
    description: "Design and build production-grade REST APIs with Node.js, Express, JWT authentication, input validation, and PostgreSQL — all following industry best practices.",
    difficulty: "intermediate",
    tags: ["node", "express", "api", "backend"],
    videoTopic: "node",
    sections: [
      {
        title: "Express Foundations",
        description: "Build a solid, well-structured Express application from scratch.",
        lessons: [
          { title: "Node.js Internals and the Event Loop", summary: "libuv, non-blocking I/O, and async patterns." },
          { title: "Setting Up an Express App", summary: "Project structure, middleware order, and error handling." },
          { title: "Routing: Resources, Params, and Query Strings", summary: "RESTful URL design and express.Router." },
          { title: "Request Parsing: JSON, URL-encoded, Multipart", summary: "Body parsers and file upload with Multer." },
          { title: "Response Formatting and Status Codes", summary: "Consistent API responses and HTTP semantics." },
          { title: "Environment Configuration with dotenv", summary: "Managing secrets and per-environment config." },
          { title: "Logging with Morgan and Winston", summary: "Request logs and structured application logging." },
          { title: "Global Error Handling Middleware", summary: "Catching and formatting all errors in one place." },
        ],
      },
      {
        title: "Authentication and Security",
        description: "Protect your API with JWTs, refresh tokens, and security headers.",
        lessons: [
          { title: "Password Hashing with bcrypt", summary: "Salt rounds, timing attacks, and storage." },
          { title: "JWT Access and Refresh Tokens", summary: "Signing, verifying, and rotating tokens." },
          { title: "Cookie-Based Auth vs Bearer Tokens", summary: "httpOnly cookies vs Authorization header tradeoffs." },
          { title: "Role-Based Access Control (RBAC)", summary: "Middleware guards for admin and user roles." },
          { title: "Input Validation with Zod or Joi", summary: "Schema validation before business logic." },
          { title: "Rate Limiting and Brute-Force Protection", summary: "express-rate-limit and IP blocking strategies." },
          { title: "Security Headers with Helmet", summary: "CSP, HSTS, and common header hardening." },
          { title: "CORS Configuration", summary: "Origins, credentials, and preflight requests explained." },
        ],
      },
      {
        title: "Database Integration and Testing",
        description: "Connect to PostgreSQL with Prisma and write reliable API tests.",
        lessons: [
          { title: "Prisma ORM: Schema and Migrations", summary: "Model definition, relations, and migrate dev." },
          { title: "CRUD Operations with Prisma Client", summary: "findMany, create, update, delete with filters." },
          { title: "Transactions and Atomic Operations", summary: "prisma.$transaction for multi-step writes." },
          { title: "Pagination: Offset vs Cursor-Based", summary: "Implementing both strategies with Prisma." },
          { title: "File Uploads to S3 or Local Storage", summary: "Presigned URLs and local fallback patterns." },
          { title: "API Testing with Supertest and Vitest", summary: "Integration tests that hit a real test database." },
          { title: "Seeding and Test Database Isolation", summary: "Repeatable test data without flaky tests." },
          { title: "Project: Build a Full Auth + CRUD API", summary: "Complete user management API with tests and docs." },
        ],
      },
    ],
  },
  {
    slug: "postgresql-mastery",
    title: "PostgreSQL Mastery",
    description: "Go from SQL beginner to database professional — learn complex queries, indexing strategies, query planning, and data modelling patterns for production systems.",
    difficulty: "intermediate",
    tags: ["postgres", "sql", "database", "backend"],
    videoTopic: "sql",
    sections: [
      {
        title: "SQL Fundamentals and Data Modelling",
        description: "Write confident SQL and design well-structured schemas.",
        lessons: [
          { title: "Relational Model and Why Postgres", summary: "Tables, rows, columns, and ACID properties." },
          { title: "CREATE TABLE, Data Types, and Constraints", summary: "NOT NULL, UNIQUE, CHECK, and DEFAULT." },
          { title: "SELECT, WHERE, ORDER BY, LIMIT", summary: "Reading data with filters and sorting." },
          { title: "INSERT, UPDATE, DELETE, and RETURNING", summary: "Modifying data safely with returning clauses." },
          { title: "JOINs: INNER, LEFT, RIGHT, FULL", summary: "Combining tables and understanding join mechanics." },
          { title: "Normalisation: 1NF, 2NF, 3NF", summary: "Eliminating redundancy in schema design." },
          { title: "Primary Keys, Foreign Keys, and Referential Integrity", summary: "Maintaining data consistency." },
          { title: "Entity-Relationship Diagrams", summary: "Designing schemas visually before writing DDL." },
        ],
      },
      {
        title: "Advanced Queries and Window Functions",
        description: "Write powerful queries that most developers never learn.",
        lessons: [
          { title: "Aggregate Functions: COUNT, SUM, AVG, MIN, MAX", summary: "Summarising data in a single query." },
          { title: "GROUP BY, HAVING, and Filtering Aggregates", summary: "Advanced grouping patterns." },
          { title: "Subqueries and CTEs (WITH clause)", summary: "Readable, composable query building." },
          { title: "Window Functions: ROW_NUMBER, RANK, DENSE_RANK", summary: "Ranking and partitioning rows." },
          { title: "LAG, LEAD, and Running Totals", summary: "Time-series analysis with window functions." },
          { title: "CASE Expressions and Conditional Logic", summary: "Pivoting data and conditional aggregation." },
          { title: "JSONB for Semi-Structured Data", summary: "Storing and querying JSON inside Postgres." },
          { title: "Full-Text Search", summary: "tsvector, tsquery, and GIN indexes for search." },
        ],
      },
      {
        title: "Indexing, Query Planning, and Performance",
        description: "Make your queries fast and keep them fast at scale.",
        lessons: [
          { title: "How Postgres Executes a Query", summary: "Parser, planner, executor — and EXPLAIN output." },
          { title: "EXPLAIN ANALYSE: Reading Query Plans", summary: "Seq scan vs index scan and cost estimates." },
          { title: "B-Tree Indexes: How They Work", summary: "Index internals and when they get used." },
          { title: "Partial and Composite Indexes", summary: "Targeted indexing for common query patterns." },
          { title: "GIN and GiST Indexes", summary: "When to use special-purpose index types." },
          { title: "Avoiding N+1 and Inefficient JOINs", summary: "Query patterns that destroy performance." },
          { title: "VACUUM, ANALYZE, and Table Bloat", summary: "Maintenance tasks for long-running databases." },
          { title: "Project: Design and Optimise an E-Commerce Schema", summary: "Real schema design with benchmarked queries." },
        ],
      },
    ],
  },
  {
    slug: "docker-and-containers",
    title: "Docker and Containers",
    description: "Containerise your applications, manage multi-service environments with Docker Compose, and build CI/CD-ready images following production best practices.",
    difficulty: "intermediate",
    tags: ["docker", "devops", "containers", "backend"],
    videoTopic: "devops",
    sections: [
      {
        title: "Docker Fundamentals",
        description: "Understand containers and build your first Docker images.",
        lessons: [
          { title: "VMs vs Containers: What Docker Actually Does", summary: "namespaces, cgroups, and the OCI spec." },
          { title: "Installing Docker and Docker Desktop", summary: "Setup on Mac, Linux, and Windows (WSL2)." },
          { title: "Your First Container: docker run", summary: "Images, containers, and the Docker Hub registry." },
          { title: "Writing a Dockerfile", summary: "FROM, RUN, COPY, WORKDIR, EXPOSE, CMD, ENTRYPOINT." },
          { title: "Building and Tagging Images", summary: "docker build, tag naming conventions, and layers." },
          { title: "Docker Layer Caching", summary: "Ordering instructions for fast incremental builds." },
          { title: "Environment Variables and Build Args", summary: "Passing config into containers safely." },
          { title: "Managing Images and Containers", summary: "ps, stop, rm, rmi, prune — keeping Docker clean." },
        ],
      },
      {
        title: "Docker Compose and Multi-Service Apps",
        description: "Orchestrate full-stack applications with Docker Compose.",
        lessons: [
          { title: "docker-compose.yml Syntax", summary: "services, networks, volumes, and depends_on." },
          { title: "Running a Node + Postgres Stack", summary: "Service discovery, healthchecks, and env files." },
          { title: "Named Volumes and Bind Mounts", summary: "Persisting data and live-reloading in development." },
          { title: "Custom Networks and Service DNS", summary: "Container-to-container communication." },
          { title: "Overriding Compose for Production", summary: "docker-compose.override.yml patterns." },
          { title: "Running Database Migrations on Start", summary: "entrypoint scripts and init containers." },
          { title: "Scaling Services with Compose", summary: "--scale flag and load balancing basics." },
          { title: "Project: Containerise a Full-Stack App", summary: "React + Node + Postgres in a single compose file." },
        ],
      },
      {
        title: "Production Images and CI/CD",
        description: "Build lean, secure images and integrate Docker into your pipeline.",
        lessons: [
          { title: "Multi-Stage Builds", summary: "Separate build and runtime stages for tiny images." },
          { title: "Minimal Base Images: Alpine and Distroless", summary: "Reducing attack surface and image size." },
          { title: "Running as Non-Root User", summary: "Security hardening inside the container." },
          { title: "Docker Image Scanning with Trivy", summary: "Finding CVEs in your images before deployment." },
          { title: "Pushing to Docker Hub and GHCR", summary: "Tagging, pushing, and pulling from registries." },
          { title: "Building Images in GitHub Actions", summary: "Automated build, test, and push pipeline." },
          { title: "Deploying Containers to a VPS", summary: "docker pull and systemd service management." },
          { title: "Project: Full CI/CD Pipeline with Docker", summary: "Automated build → test → push → deploy pipeline." },
        ],
      },
    ],
  },
  {
    slug: "git-and-github",
    title: "Git & GitHub Mastery",
    description: "Stop fear-committing and start collaborating like a pro — branching strategies, rebase, conflict resolution, pull requests, and GitHub Actions all covered.",
    difficulty: "beginner",
    tags: ["git", "github", "workflow", "collaboration"],
    videoTopic: "devops",
    sections: [
      {
        title: "Git Internals and Core Commands",
        description: "Understand how Git actually stores data and master the essential commands.",
        lessons: [
          { title: "How Git Stores Data: Objects and Refs", summary: "Blobs, trees, commits, and the .git directory." },
          { title: "git init, clone, and remote", summary: "Starting projects and connecting to GitHub." },
          { title: "Staging Area, git add, and git commit", summary: "The three areas of Git and meaningful commits." },
          { title: "git status, diff, and log", summary: "Understanding what changed and why." },
          { title: "Undoing Changes: restore, reset, and revert", summary: "Safely correcting mistakes at any stage." },
          { title: "gitignore: What to Exclude", summary: "Patterns for build artefacts, secrets, and node_modules." },
          { title: "Stashing Work in Progress", summary: "git stash save, pop, apply, and list." },
          { title: "git bisect for Finding Bugs", summary: "Binary search through history to find regressions." },
        ],
      },
      {
        title: "Branching, Merging, and Rebasing",
        description: "Work in parallel with confidence and maintain a clean history.",
        lessons: [
          { title: "Branches: Create, Switch, and Delete", summary: "Branch management and HEAD demystified." },
          { title: "Merging: Fast-Forward vs Three-Way", summary: "When each merge type occurs and what it looks like." },
          { title: "Resolving Merge Conflicts", summary: "Conflict markers, resolution tools, and VS Code integration." },
          { title: "git rebase: Rewriting History", summary: "Rebasing feature branches and golden rule of rebasing." },
          { title: "Interactive Rebase: squash, fixup, reword", summary: "Cleaning up messy commit history." },
          { title: "Cherry-Pick", summary: "Applying specific commits to another branch." },
          { title: "Tags and Versioning", summary: "Lightweight vs annotated tags and semantic versioning." },
          { title: "git reflog: Your Safety Net", summary: "Recovering lost commits and branches." },
        ],
      },
      {
        title: "GitHub Collaboration and Automation",
        description: "Work professionally on teams with pull requests and automated workflows.",
        lessons: [
          { title: "Pull Requests: Best Practices", summary: "Writing good PRs, review etiquette, and draft PRs." },
          { title: "Branch Protection Rules", summary: "Required reviews, status checks, and merge strategies." },
          { title: "GitHub Issues and Project Boards", summary: "Lightweight project management inside GitHub." },
          { title: "GitHub Actions Fundamentals", summary: "Workflows, triggers, jobs, and steps." },
          { title: "CI Pipeline: Lint, Test, and Build on PR", summary: "Automated quality gates for every pull request." },
          { title: "Secrets and Environment Variables in Actions", summary: "Securely storing tokens and credentials." },
          { title: "GitHub Pages and Static Deployment", summary: "Deploying documentation and frontend apps for free." },
          { title: "Project: Team Workflow Simulation", summary: "Full fork → branch → PR → merge → deploy exercise." },
        ],
      },
    ],
  },
  {
    slug: "system-design-fundamentals",
    title: "System Design Fundamentals",
    description: "Learn to design scalable distributed systems — load balancing, caching, databases at scale, message queues, and microservices — with real-world architecture examples.",
    difficulty: "advanced",
    tags: ["system-design", "architecture", "scalability", "backend"],
    videoTopic: "devops",
    sections: [
      {
        title: "Scalability and Reliability Foundations",
        description: "Core concepts every system designer must understand.",
        lessons: [
          { title: "Vertical vs Horizontal Scaling", summary: "Scale-up vs scale-out tradeoffs and when each applies." },
          { title: "Latency, Throughput, and Availability", summary: "The key metrics and how they relate." },
          { title: "CAP Theorem and Consistency Models", summary: "CP vs AP systems and eventual consistency." },
          { title: "Load Balancers: L4 vs L7", summary: "Round-robin, least connections, and sticky sessions." },
          { title: "CDNs and Edge Caching", summary: "How CDNs work and when to use them." },
          { title: "DNS, Anycast, and Global Traffic Management", summary: "Routing users to the nearest data centre." },
          { title: "Fault Tolerance: Redundancy and Failover", summary: "Active-passive, active-active, and circuit breakers." },
          { title: "SLAs, SLOs, and Error Budgets", summary: "Defining and measuring reliability contracts." },
        ],
      },
      {
        title: "Data Storage at Scale",
        description: "Choose the right database and caching strategy for any workload.",
        lessons: [
          { title: "SQL vs NoSQL: Decision Framework", summary: "When relational wins and when it doesn't." },
          { title: "Database Replication: Leader-Follower", summary: "Read replicas, replication lag, and failover." },
          { title: "Database Sharding Strategies", summary: "Range, hash, and directory-based sharding." },
          { title: "Caching with Redis: Patterns and Pitfalls", summary: "Cache-aside, write-through, and TTL strategies." },
          { title: "Cache Invalidation", summary: "The hardest problem in computer science, solved practically." },
          { title: "Object Storage: S3 and Beyond", summary: "Blob storage patterns for media and documents." },
          { title: "Search at Scale: Elasticsearch", summary: "Inverted indexes, relevance scoring, and sharding." },
          { title: "Time-Series Databases", summary: "InfluxDB and TimescaleDB for metrics and events." },
        ],
      },
      {
        title: "Microservices and Real-World Architectures",
        description: "Design systems used by millions of users.",
        lessons: [
          { title: "Monolith vs Microservices: The Honest Tradeoffs", summary: "When microservices hurt and when they help." },
          { title: "API Gateways", summary: "Routing, auth, rate limiting, and observability at the edge." },
          { title: "Message Queues: Kafka and RabbitMQ", summary: "Async communication, fan-out, and consumer groups." },
          { title: "Event-Driven Architecture", summary: "Event sourcing, CQRS, and the outbox pattern." },
          { title: "Service Discovery and Configuration", summary: "Consul, env injection, and dynamic config." },
          { title: "Distributed Tracing and Observability", summary: "OpenTelemetry, traces, metrics, and logs." },
          { title: "Case Study: Design Twitter's News Feed", summary: "Full architecture walkthrough with tradeoffs." },
          { title: "Case Study: Design a URL Shortener at Scale", summary: "Full architecture walkthrough with tradeoffs." },
        ],
      },
    ],
  },
];

// ─── Roadmap blueprints ───────────────────────────────────────────────────────
const ROADMAP_BLUEPRINTS = [
  {
    slug: "python-developer-roadmap",
    title: "Python Developer Roadmap",
    description: "From Python beginner to data-science-ready developer.",
    thumbnail: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=1280&h=720&fit=crop",
    tracks: [
      { title: "Python Foundations", description: "Core language skills every Python developer must have.", courseSlugs: ["python-for-beginners", "javascript-fundamentals"] },
      { title: "Python for Data Science", description: "Analyse data and build your first ML models.", courseSlugs: ["python-data-science", "postgresql-mastery"] },
    ],
  },
  {
    slug: "frontend-engineer-roadmap",
    title: "Frontend Engineer Roadmap",
    description: "From web basics to modern React and Next.js applications.",
    thumbnail: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=1280&h=720&fit=crop",
    tracks: [
      { title: "JavaScript and TypeScript", description: "Master the language of the web before touching a framework.", courseSlugs: ["javascript-fundamentals", "advanced-javascript", "typescript-in-depth"] },
      { title: "React and Next.js", description: "Build and ship production-quality React applications.", courseSlugs: ["react-complete-guide", "nextjs-production"] },
    ],
  },
  {
    slug: "backend-engineer-roadmap",
    title: "Backend Engineer Roadmap",
    description: "Build, secure, and scale production backend services.",
    thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1280&h=720&fit=crop",
    tracks: [
      { title: "APIs and Databases", description: "Node.js APIs backed by a solid PostgreSQL foundation.", courseSlugs: ["node-rest-apis", "postgresql-mastery"] },
      { title: "DevOps and Architecture", description: "Containerise, ship, and design scalable systems.", courseSlugs: ["docker-and-containers", "git-and-github", "system-design-fundamentals"] },
    ],
  },
  {
    slug: "fullstack-fast-track",
    title: "Fullstack Fast Track",
    description: "A focused path covering the full stack — from UI to API to deployment.",
    thumbnail: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=1280&h=720&fit=crop",
    tracks: [
      { title: "UI to API", description: "Build a complete feature from React frontend to Node backend.", courseSlugs: ["react-complete-guide", "node-rest-apis", "postgresql-mastery"] },
      { title: "Ship and Scale", description: "Containerise, test, and design for growth.", courseSlugs: ["docker-and-containers", "git-and-github", "system-design-fundamentals"] },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pick = (arr, index) => arr[index % arr.length];

const getVideoUrl = (topic, lessonIndex) => {
  const pool = TOPIC_VIDEOS[topic] ?? TOPIC_VIDEOS.default;
  return pool[lessonIndex % pool.length];
};

const getQuizQuestions = (courseSlug, sectionIndex) => {
  return COURSE_QUIZ_QUESTIONS[courseSlug]?.[sectionIndex] ?? null;
};

const getDragDropConfig = (courseSlug, sectionIndex, sectionTitle) => {
  return COURSE_DRAG_DROP[courseSlug]?.[sectionIndex] ?? DEFAULT_DRAG_DROP(sectionTitle);
};

// ─── Lesson builder ───────────────────────────────────────────────────────────
const makeLessonPayload = (
  courseSlug,
  lessonBlueprint,
  sectionOrder,
  lessonOrder,
  videoTopic
) => {
  const lessonType = lessonOrder <= 6 ? "video" : lessonOrder === 7 ? "article" : "attachment";

  return {
    title: lessonBlueprint.title,
    order: lessonOrder,
    type: lessonType,
    videoUrl: lessonType === "video"
      ? getVideoUrl(videoTopic, (sectionOrder - 1) * 8 + lessonOrder - 1)
      : "",
    duration: lessonType === "video" ? 180 + lessonOrder * 45 : 0,
    body: lessonType === "article"
      ? `${lessonBlueprint.summary} This article covers the key takeaways from section ${sectionOrder}, providing written reference material you can revisit any time.`
      : "",
    attachmentUrl: lessonType === "attachment"
      ? `https://example.com/assets/${courseSlug}/section-${sectionOrder}/resources.pdf`
      : "",
    isPreview: sectionOrder === 1 && lessonOrder <= 2,
  };
};

// ─── Level builders ───────────────────────────────────────────────────────────
const makeLevelPayload = (
  type,
  courseTitle,
  courseSlug,
  sectionTitle,
  sectionIndex,  // 0-based for lookup
  sectionOrder,  // 1-based for display
  levelOrder
) => {
  const base = {
    title: `${sectionTitle} — Level ${sectionOrder}.${levelOrder}`,
    order: levelOrder,
    type,
    xpReward: 15 + levelOrder * 5,
    passingScore: type === "code_challenge" ? 80 : 70,
    cooldownMinutes: 0,
    isPublished: true,
  };

  switch (type) {
    case "quiz": {
      const questions = getQuizQuestions(courseSlug, sectionIndex) ??
        DEFAULT_QUIZ(courseTitle, sectionTitle);
      return { ...base, config: { questions } };
    }
    case "drag_drop":
      return { ...base, config: getDragDropConfig(courseSlug, sectionIndex, sectionTitle) };
    case "code_challenge":
      return { ...base, config: makeCodeChallengeConfig(courseTitle) };
    default:
      return { ...base, config: makeFillBlankConfig(sectionTitle) };
  }
};

// ─── Seeding functions ────────────────────────────────────────────────────────
const seedCourseCatalog = async () => {
  const seededCourseMetaBySlug = {};

  for (let courseIndex = 0; courseIndex < COURSE_BLUEPRINTS.length; courseIndex++) {
    const blueprint = COURSE_BLUEPRINTS[courseIndex];
    const thumbnail = COURSE_THUMBNAILS[blueprint.slug] ??
      `https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=1280&h=720&fit=crop`;

    const courseData = {
      authorId: pick(AUTHORS, courseIndex),
      title: blueprint.title,
      slug: blueprint.slug,
      description: blueprint.description,
      thumbnail,
      tags: blueprint.tags,
      language: "en",
      status: "published",
      difficulty: blueprint.difficulty,
      freeUpToLesson: 4,
      freeUpToLevel: 1,
    };

    const course = await prisma.course.upsert({
      where: { slug: blueprint.slug },
      update: courseData,
      create: courseData,
    });

    const sectionIdByOrder = {};
    const firstSectionLessonIds = [];
    let firstLevelId = null;

    // ── Video sections ──────────────────────────────────────────────────────
    for (let sectionIndex = 0; sectionIndex < blueprint.sections.length; sectionIndex++) {
      const sectionBlueprint = blueprint.sections[sectionIndex];
      const sectionOrder = sectionIndex + 1;

      const sectionData = {
        title: sectionBlueprint.title,
        description: sectionBlueprint.description,
        order: sectionOrder,
        type: "video_section",
        isSkippable: true,
      };

      const section = await prisma.section.upsert({
        where: { courseId_order: { courseId: course.id, order: sectionOrder } },
        update: sectionData,
        create: { courseId: course.id, ...sectionData },
      });

      sectionIdByOrder[sectionOrder] = section.id;

      // Lessons
      for (let lessonIndex = 0; lessonIndex < sectionBlueprint.lessons.length; lessonIndex++) {
        const lessonBlueprint = sectionBlueprint.lessons[lessonIndex];
        const lessonOrder = lessonIndex + 1;

        const lessonData = makeLessonPayload(
          blueprint.slug,
          lessonBlueprint,
          sectionOrder,
          lessonOrder,
          blueprint.videoTopic
        );

        const lesson = await prisma.lesson.upsert({
          where: { sectionId_order: { sectionId: section.id, order: lessonOrder } },
          update: lessonData,
          create: { sectionId: section.id, ...lessonData },
        });

        if (sectionOrder === 1 && lessonOrder <= 5) {
          firstSectionLessonIds.push(lesson.id);
        }
      }

      // ── 2 game levels per video section: quiz + drag_drop ────────────────
      const quizData = makeLevelPayload("quiz", blueprint.title, blueprint.slug, sectionBlueprint.title, sectionIndex, sectionOrder, 1);
      const quizLevel = await prisma.gameLevel.upsert({
        where: { sectionId_order: { sectionId: section.id, order: 1 } },
        update: quizData,
        create: { sectionId: section.id, ...quizData },
      });

      const dragData = makeLevelPayload("drag_drop", blueprint.title, blueprint.slug, sectionBlueprint.title, sectionIndex, sectionOrder, 2);
      await prisma.gameLevel.upsert({
        where: { sectionId_order: { sectionId: section.id, order: 2 } },
        update: dragData,
        create: { sectionId: section.id, ...dragData },
      });

      if (sectionOrder === 1) firstLevelId = quizLevel.id;
    }

    // ── Challenge arena section — made entirely of levels ──────────────────
    // This section has NO lessons, only 4 game levels of different types
    const challengeSectionOrder = blueprint.sections.length + 1;
    const challengeSectionData = {
      title: `${blueprint.title} — Challenge Arena`,
      description: `Prove your ${blueprint.title} skills with timed quizzes, drag-and-drop challenges, code exercises, and fill-in-the-blank questions.`,
      order: challengeSectionOrder,
      type: "challenge_section",
      isSkippable: true,
    };

    const challengeSection = await prisma.section.upsert({
      where: { courseId_order: { courseId: course.id, order: challengeSectionOrder } },
      update: challengeSectionData,
      create: { courseId: course.id, ...challengeSectionData },
    });

    sectionIdByOrder[challengeSectionOrder] = challengeSection.id;

    // Challenge arena: quiz → drag_drop → code_challenge → fill_blank
    // Each uses the last section's topic questions for quiz/drag for relevance
    const lastSectionIndex = blueprint.sections.length - 1;
    const lastSectionTitle = blueprint.sections[lastSectionIndex].title;

    const arenaLevels = [
      { type: "quiz",           order: 1, xp: 25 },
      { type: "drag_drop",      order: 2, xp: 20 },
      { type: "code_challenge", order: 3, xp: 35 },
      { type: "fill_blank",     order: 4, xp: 15 },
    ];

    for (const al of arenaLevels) {
      const levelData = makeLevelPayload(
        al.type,
        blueprint.title,
        blueprint.slug,
        `${blueprint.title} Final Challenge`,
        lastSectionIndex,
        challengeSectionOrder,
        al.order
      );
      // Override xp for arena
      levelData.xpReward = al.xp;

      await prisma.gameLevel.upsert({
        where: { sectionId_order: { sectionId: challengeSection.id, order: al.order } },
        update: levelData,
        create: { sectionId: challengeSection.id, ...levelData },
      });
    }

    // Placement skip rule for section 2
    const skipSectionId = sectionIdByOrder[2];
    if (skipSectionId) {
      await prisma.placementSkipRule.upsert({
        where: { courseId_sectionId: { courseId: course.id, sectionId: skipSectionId } },
        update: { minScore: 75 },
        create: { courseId: course.id, sectionId: skipSectionId, minScore: 75 },
      });
    }

    // Update totalXp
    const xpResult = await prisma.gameLevel.aggregate({
      where: { section: { courseId: course.id } },
      _sum: { xpReward: true },
    });
    await prisma.course.update({
      where: { id: course.id },
      data: { totalXp: xpResult._sum.xpReward ?? 0 },
    });

    seededCourseMetaBySlug[blueprint.slug] = {
      id: course.id,
      slug: blueprint.slug,
      title: blueprint.title,
      sectionIdByOrder,
      firstSectionLessonIds,
      firstLevelId,
    };

    console.info(`  ✓ course ${courseIndex + 1}/${COURSE_BLUEPRINTS.length}: ${blueprint.title}`);
  }

  return seededCourseMetaBySlug;
};

// ─────────────────────────────────────────────────────────────────────────────
const seedRoadmaps = async (seededCourseMetaBySlug) => {
  let firstRoadmapId = null;
  let firstTrackId = null;

  for (let ri = 0; ri < ROADMAP_BLUEPRINTS.length; ri++) {
    const rb = ROADMAP_BLUEPRINTS[ri];

    const roadmapData = {
      authorId: pick(AUTHORS, ri),
      title: rb.title,
      slug: rb.slug,
      description: rb.description,
      thumbnail: rb.thumbnail,
      tags: ["roadmap", "learning", "career"],
      status: "published",
    };

    const roadmap = await prisma.roadmap.upsert({
      where: { slug: rb.slug },
      update: roadmapData,
      create: roadmapData,
    });

    if (ri === 0) firstRoadmapId = roadmap.id;

    for (let ti = 0; ti < rb.tracks.length; ti++) {
      const tb = rb.tracks[ti];
      const trackOrder = ti + 1;

      const trackData = {
        title: tb.title,
        description: tb.description,
        order: trackOrder,
        freeUpToNode: 1,
      };

      const track = await prisma.track.upsert({
        where: { roadmapId_order: { roadmapId: roadmap.id, order: trackOrder } },
        update: trackData,
        create: { roadmapId: roadmap.id, ...trackData },
      });

      if (ri === 0 && trackOrder === 1) firstTrackId = track.id;

      const uniqueSlugs = [...new Set(tb.courseSlugs)];
      for (let ni = 0; ni < uniqueSlugs.length; ni++) {
        const meta = seededCourseMetaBySlug[uniqueSlugs[ni]];
        if (!meta) continue;

        await prisma.trackNode.upsert({
          where: { trackId_order: { trackId: track.id, order: ni + 1 } },
          update: { courseId: meta.id, isSkippable: ni === 0, prerequisiteIds: [] },
          create: { trackId: track.id, courseId: meta.id, order: ni + 1, isSkippable: ni === 0, prerequisiteIds: [] },
        });
      }
    }

    console.info(`  ✓ roadmap ${ri + 1}/${ROADMAP_BLUEPRINTS.length}: ${rb.title}`);
  }

  return { firstRoadmapId, firstTrackId };
};

// ─────────────────────────────────────────────────────────────────────────────
const seedLearnerData = async (
  seededCourseMetaBySlug,
  roadmapMeta
) => {
  const courseMetaList = Object.values(seededCourseMetaBySlug).slice(0, 8);

  for (let si = 0; si < STUDENTS.length; si++) {
    const studentId = STUDENTS[si];

    for (let ci = 0; ci < courseMetaList.length; ci++) {
      const courseMeta = courseMetaList[ci];
      const isCompleted = si === 0 && ci < 2;
      const progress = isCompleted ? 100 : Math.min(92, 25 + si * 10 + ci * 5);

      const enrollmentData = {
        status: isCompleted ? "completed" : "active",
        xpEarned: Math.round(progress * 12),
        placementScore: 70 + ((si + ci) % 20),
        completedAt: isCompleted ? new Date() : null,
      };

      const enrollment = await prisma.enrollment.upsert({
        where: { userId_courseId: { userId: studentId, courseId: courseMeta.id } },
        update: enrollmentData,
        create: { userId: studentId, courseId: courseMeta.id, ...enrollmentData },
      });

      const currentLessonId =
        courseMeta.firstSectionLessonIds[
          Math.min(courseMeta.firstSectionLessonIds.length - 1, 1 + si)
        ] ?? null;

      await prisma.courseProgress.upsert({
        where: { enrollmentId: enrollment.id },
        update: {
          currentSectionId: courseMeta.sectionIdByOrder[1] ?? null,
          currentLessonId,
          currentLevelId: courseMeta.firstLevelId,
          overallProgress: progress,
        },
        create: {
          enrollmentId: enrollment.id,
          currentSectionId: courseMeta.sectionIdByOrder[1] ?? null,
          currentLessonId,
          currentLevelId: courseMeta.firstLevelId,
          overallProgress: progress,
        },
      });

      for (let i = 0; i < courseMeta.firstSectionLessonIds.length; i++) {
        const lessonId = courseMeta.firstSectionLessonIds[i];
        const done = isCompleted || i < 2 + si;

        await prisma.lessonProgress.upsert({
          where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
          update: { watchedUpTo: done ? 9999 : 120 + i * 60, isCompleted: done, completedAt: done ? new Date() : null },
          create: { enrollmentId: enrollment.id, lessonId, watchedUpTo: done ? 9999 : 120 + i * 60, isCompleted: done, completedAt: done ? new Date() : null },
        });
      }

      await prisma.review.upsert({
        where: { userId_courseId: { userId: studentId, courseId: courseMeta.id } },
        update: { rating: 4 + ((ci + si) % 2), comment: `Really solid content — ${courseMeta.title} taught me exactly what I needed.` },
        create: { userId: studentId, courseId: courseMeta.id, rating: 4 + ((ci + si) % 2), comment: `Really solid content — ${courseMeta.title} taught me exactly what I needed.` },
      });

      if (si === 2 && courseMeta.sectionIdByOrder[2]) {
        await prisma.skippedSection.upsert({
          where: { enrollmentId_sectionId: { enrollmentId: enrollment.id, sectionId: courseMeta.sectionIdByOrder[2] } },
          update: { reason: "manual" },
          create: { enrollmentId: enrollment.id, sectionId: courseMeta.sectionIdByOrder[2], reason: "manual" },
        });
      }
    }
  }

  // Roadmap learner data
  if (roadmapMeta.firstRoadmapId && roadmapMeta.firstTrackId) {
    const trackNodes = await prisma.trackNode.findMany({
      where: { trackId: roadmapMeta.firstTrackId },
      orderBy: { order: "asc" },
    });

    for (let i = 0; i < Math.min(3, STUDENTS.length); i++) {
      const studentId = STUDENTS[i];

      const roadmapEnrollment = await prisma.roadmapEnrollment.upsert({
        where: { userId_roadmapId: { userId: studentId, roadmapId: roadmapMeta.firstRoadmapId } },
        update: { trackId: roadmapMeta.firstTrackId, status: "active", progress: Math.min(95, 20 + i * 25), completedAt: null },
        create: { userId: studentId, roadmapId: roadmapMeta.firstRoadmapId, trackId: roadmapMeta.firstTrackId, status: "active", progress: Math.min(95, 20 + i * 25) },
      });

      for (let ni = 0; ni < trackNodes.length; ni++) {
        const node = trackNodes[ni];
        let status = "locked";
        let courseProgress = 0;

        if (ni === 0) { status = "completed"; courseProgress = 100; }
        else if (ni === 1) { status = i === 0 ? "completed" : "in_progress"; courseProgress = i === 0 ? 100 : 45 + i * 10; }
        else if (ni === 2 && i >= 1) { status = "unlocked"; courseProgress = 0; }

        await prisma.trackNodeProgress.upsert({
          where: { roadmapEnrollmentId_trackNodeId: { roadmapEnrollmentId: roadmapEnrollment.id, trackNodeId: node.id } },
          update: { status, courseProgress, skippedAt: null, completedAt: status === "completed" ? new Date() : null },
          create: { roadmapEnrollmentId: roadmapEnrollment.id, trackNodeId: node.id, status, courseProgress, skippedAt: null, completedAt: status === "completed" ? new Date() : null },
        });
      }
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
const printSummary = async () => {
  const [courseCount, sectionCount, lessonCount, levelCount, enrollmentCount, reviewCount, roadmapCount, trackCount, nodeCount] =
    await Promise.all([
      prisma.course.count(),
      prisma.section.count(),
      prisma.lesson.count(),
      prisma.gameLevel.count(),
      prisma.enrollment.count(),
      prisma.review.count(),
      prisma.roadmap.count(),
      prisma.track.count(),
      prisma.trackNode.count(),
    ]);

  console.info("\n── Seed Summary ─────────────────────────────────────");
  console.info(`  courses:     ${courseCount}`);
  console.info(`  sections:    ${sectionCount}`);
  console.info(`  lessons:     ${lessonCount}`);
  console.info(`  gameLevels:  ${levelCount}`);
  console.info(`  enrollments: ${enrollmentCount}`);
  console.info(`  reviews:     ${reviewCount}`);
  console.info(`  roadmaps:    ${roadmapCount}`);
  console.info(`  tracks:      ${trackCount}`);
  console.info(`  trackNodes:  ${nodeCount}`);
  console.info("─────────────────────────────────────────────────────");
};

// ─────────────────────────────────────────────────────────────────────────────
const seed = async () => {
  console.info("Seeding course-service database…\n");
  const seededCourseMetaBySlug = await seedCourseCatalog();
  const roadmapMeta = await seedRoadmaps(seededCourseMetaBySlug);
  await seedLearnerData(seededCourseMetaBySlug, roadmapMeta);
  await printSummary();
  console.info("\n✅ Seed complete.");
};

seed()
  .catch((err) => { console.error("❌ Seed failed:", err); process.exit(1); })
  .finally(() => prisma.$disconnect());