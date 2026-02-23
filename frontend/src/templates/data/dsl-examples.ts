import type { Template } from '../../types/template-types';

/**
 * DSL Example Templates
 * These templates contain DSL/Mermaid text content that gets rendered
 * via the DSL engine instead of loading pre-built element arrays.
 */

export const yslFlowchartTemplate: Template = {
    metadata: {
        id: 'dsl-ysl-flowchart',
        name: 'Flowchart (YSL)',
        category: 'dsl-examples',
        description: 'Simple login flow using YappyDraw DSL',
        tags: ['ysl', 'flowchart', 'dsl'],
        order: 1,
    },
    data: { elements: [], layers: [] },
    dslContent: `---
title: Simple Flowchart
layout: tree-down
---

start [circle] "Start"
login [rect] "Login Form"
check [decision] "Valid?"
dashboard [rect] "Dashboard"
error [rect] "Error" { backgroundColor: "#fecaca" }
end [circle] "End"

start -> login
login -> check
check -> dashboard "Yes"
check -> error "No"
error -> login "Retry"
dashboard -> end`,
};

export const yslMindmapTemplate: Template = {
    metadata: {
        id: 'dsl-ysl-mindmap',
        name: 'Mindmap (YSL)',
        category: 'dsl-examples',
        description: 'Project planning mindmap with hierarchical branches',
        tags: ['ysl', 'mindmap', 'dsl'],
        order: 2,
    },
    data: { elements: [], layers: [] },
    dslContent: `---
title: Project Planning Mindmap
layout: tree-right
---

root [rect] "Project Plan"
  design [rect] "Design"
    ui [rect] "UI/UX"
    arch [rect] "Architecture"
    db [rect] "Database Schema"
  develop [rect] "Development"
    frontend [rect] "Frontend"
    backend [rect] "Backend"
    api [rect] "API Layer"
  testing [rect] "Testing"
    unit [rect] "Unit Tests"
    integration [rect] "Integration"
    e2e [rect] "E2E Tests"
  deploy [rect] "Deployment"
    staging [rect] "Staging"
    prod [rect] "Production"`,
};

export const yslInfrastructureTemplate: Template = {
    metadata: {
        id: 'dsl-ysl-infrastructure',
        name: 'Cloud Infrastructure (YSL)',
        category: 'dsl-examples',
        description: 'Web application infrastructure with servers, databases, and services',
        tags: ['ysl', 'infrastructure', 'cloud', 'dsl'],
        order: 3,
    },
    data: { elements: [], layers: [] },
    dslContent: `---
title: Cloud Infrastructure
layout: tree-down
hSpacing: 140
vSpacing: 100
---

users [user] "Users"
cdn_node [cdn] "CDN"
lb_node [lb] "Load Balancer"
web1 [server] "Web Server 1"
web2 [server] "Web Server 2"
api_gw [api-gateway] "API Gateway"
svc1 [microservice] "Auth Service"
svc2 [microservice] "Order Service"
svc3 [microservice] "Catalog Service"
mq [queue] "Message Queue"
db_main [db] "PostgreSQL"
db_cache [db] "Redis Cache"

users -> cdn_node
cdn_node -> lb_node
lb_node -> web1
lb_node -> web2
web1 -> api_gw
web2 -> api_gw
api_gw -> svc1
api_gw -> svc2
api_gw -> svc3
svc2 -> mq
mq -> svc3
svc1 -> db_main
svc2 -> db_main
svc3 -> db_cache`,
};

export const yslSequenceTemplate: Template = {
    metadata: {
        id: 'dsl-ysl-sequence',
        name: 'Sequence Diagram (YSL)',
        category: 'dsl-examples',
        description: 'API request/response sequence with lifelines',
        tags: ['ysl', 'sequence', 'api', 'dsl'],
        order: 4,
    },
    data: { elements: [], layers: [] },
    dslContent: `---
title: API Sequence Diagram
layout: sequence
hSpacing: 200
vSpacing: 60
---

client [lifeline] "Client"
gateway [lifeline] "API Gateway"
auth [lifeline] "Auth Service"
backend [lifeline] "Backend"
db [lifeline] "Database"

client -> gateway "POST /login"
gateway -> auth "Validate Token"
auth -> gateway "200 OK"
gateway -> backend "Forward Request"
backend -> db "SELECT user"
db -> backend "User Record"
backend -> gateway "JSON Response"
gateway -> client "200 OK + Data"`,
};

export const yslDecisionTreeTemplate: Template = {
    metadata: {
        id: 'dsl-ysl-decision-tree',
        name: 'Decision Tree (YSL)',
        category: 'dsl-examples',
        description: 'Database selection decision tree with styled nodes',
        tags: ['ysl', 'decision', 'tree', 'dsl'],
        order: 5,
    },
    data: { elements: [], layers: [] },
    dslContent: `---
title: Decision Tree
layout: tree-down
hSpacing: 140
vSpacing: 90
---

start [decision] "Data Type?"
relational [decision] "Scale?"
nosql [decision] "Structure?"

postgres [rect] "PostgreSQL" { backgroundColor: "#dbeafe" }
mysql [rect] "MySQL" { backgroundColor: "#dbeafe" }

mongo [rect] "MongoDB" { backgroundColor: "#dcfce7" }
redis [rect] "Redis" { backgroundColor: "#dcfce7" }
dynamo [rect] "DynamoDB" { backgroundColor: "#dcfce7" }

start -> relational "Structured"
start -> nosql "Unstructured"
relational -> postgres "Large"
relational -> mysql "Small/Medium"
nosql -> mongo "Documents"
nosql -> redis "Key-Value"
nosql -> dynamo "Serverless"`,
};

export const yslDataStructuresTemplate: Template = {
    metadata: {
        id: 'dsl-ysl-data-structures',
        name: 'Data Structures (YSL)',
        category: 'dsl-examples',
        description: 'Array, stack, linked list, hash table, binary tree, and more',
        tags: ['ysl', 'data-structures', 'dsl'],
        order: 6,
    },
    data: { elements: [], layers: [] },
    dslContent: `---
title: Data Structure Concepts
layout: grid
columns: 3
hSpacing: 80
vSpacing: 80
---

arr [array] "Array" { width: 300, height: 80, dsValues: "10, 20, 30, 40, 50", dsShowIndices: true }
stk [stack] "Stack" { width: 120, height: 200, dsValues: "pop, C, B, A", dsDirection: "vertical" }
ll [linked-list] "Linked List" { width: 300, height: 80, dsValues: "Head, Node1, Node2, Tail" }
ht [hash-table] "Hash Table" { width: 200, height: 180, dsValues: "name:Alice, age:30, city:NYC, role:Dev, id:42", dsCapacity: 5 }
bt [binary-tree] "Binary Tree" { width: 280, height: 200, dsValues: "50, 30, 70, 20, 40, 60, 80" }
q [ds-queue] "Queue" { width: 300, height: 80, dsValues: "Front, Msg1, Msg2, Back" }`,
};

export const mermaidFlowchartTemplate: Template = {
    metadata: {
        id: 'dsl-mermaid-flowchart',
        name: 'Flowchart (Mermaid)',
        category: 'dsl-examples',
        description: 'Debugging workflow flowchart in Mermaid syntax',
        tags: ['mermaid', 'flowchart'],
        order: 10,
    },
    data: { elements: [], layers: [] },
    dslContent: `graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> E[(Check Logs)]
    E --> F{Found issue?}
    F -->|Yes| G[Fix it]
    F -->|No| H[Ask for help]
    G --> B
    H --> D
    C --> I((Done))`,
};

export const mermaidSequenceTemplate: Template = {
    metadata: {
        id: 'dsl-mermaid-sequence',
        name: 'Sequence Diagram (Mermaid)',
        category: 'dsl-examples',
        description: 'API call sequence with caching in Mermaid syntax',
        tags: ['mermaid', 'sequence'],
        order: 11,
    },
    data: { elements: [], layers: [] },
    dslContent: `sequenceDiagram
    participant C as Client
    participant A as API Server
    participant D as Database
    participant R as Redis Cache

    C->>A: GET /users/123
    A->>R: Check cache
    R-->>A: Cache miss
    A->>D: SELECT * FROM users WHERE id=123
    D-->>A: User record
    A->>R: Set cache
    A-->>C: 200 OK {user}`,
};

export const mermaidClassTemplate: Template = {
    metadata: {
        id: 'dsl-mermaid-class',
        name: 'Class Diagram (Mermaid)',
        category: 'dsl-examples',
        description: 'UML class diagram with inheritance in Mermaid syntax',
        tags: ['mermaid', 'class', 'uml'],
        order: 12,
    },
    data: { elements: [], layers: [] },
    dslContent: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound() void
    }
    class Dog {
        +String breed
        +fetch() void
    }
    class Cat {
        +bool isIndoor
        +purr() void
    }
    class Owner {
        +String name
        +adopt(animal) void
    }

    Animal <|-- Dog
    Animal <|-- Cat
    Owner --> Animal : owns`,
};

export const mermaidPieTemplate: Template = {
    metadata: {
        id: 'dsl-mermaid-pie',
        name: 'Pie Chart (Mermaid)',
        category: 'dsl-examples',
        description: 'Browser market share pie chart in Mermaid syntax',
        tags: ['mermaid', 'pie', 'chart'],
        order: 13,
    },
    data: { elements: [], layers: [] },
    dslContent: `pie title Browser Market Share
    "Chrome" : 65
    "Safari" : 19
    "Firefox" : 4
    "Edge" : 4
    "Others" : 8`,
};

export const mermaidMindmapTemplate: Template = {
    metadata: {
        id: 'dsl-mermaid-mindmap',
        name: 'Mindmap (Mermaid)',
        category: 'dsl-examples',
        description: 'Project planning mindmap in Mermaid syntax',
        tags: ['mermaid', 'mindmap'],
        order: 14,
    },
    data: { elements: [], layers: [] },
    dslContent: `mindmap
  root((Project Planning))
    Research
      Market Analysis
      Competitor Review
      User Interviews
    Design
      Wireframes
      Prototypes
      User Testing
    Development
      Frontend
      Backend
      Database
    Launch
      Marketing
      Documentation
      Support`,
};

export const mermaidERTemplate: Template = {
    metadata: {
        id: 'dsl-mermaid-er',
        name: 'ER Diagram (Mermaid)',
        category: 'dsl-examples',
        description: 'Entity-relationship diagram for e-commerce in Mermaid syntax',
        tags: ['mermaid', 'er', 'database'],
        order: 15,
    },
    data: { elements: [], layers: [] },
    dslContent: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    PRODUCT ||--o{ LINE-ITEM : "is in"
    CUSTOMER {
        string id PK
        string name
        string email
        string phone
    }
    ORDER {
        string id PK
        date created
        string status
        float total
    }
    LINE-ITEM {
        string id PK
        int quantity
        float price
    }
    PRODUCT {
        string id PK
        string name
        string category
        float price
    }`,
};

export const yslHorizontalFlowchartTemplate: Template = {
    metadata: {
        id: 'dsl-ysl-horizontal-flowchart',
        name: 'Horizontal Flowchart (YSL)',
        category: 'dsl-examples',
        description: 'Order processing flow with left-to-right layout',
        tags: ['ysl', 'flowchart', 'horizontal', 'dsl'],
        order: 7,
    },
    data: { elements: [], layers: [] },
    dslContent: `---
title: Horizontal Flowchart
layout: tree-right
---

order [rect] "New Order"
validate [decision] "Valid?"
payment [rect] "Process Payment"
reject [rect] "Reject Order" { backgroundColor: "#fecaca" }
ship [rect] "Ship Items"
deliver [capsule] "Delivered"

order -> validate
validate -> payment "Yes"
validate -> reject "No"
payment -> ship
ship -> deliver`,
};

export const yslBpmnProcessTemplate: Template = {
    metadata: {
        id: 'dsl-ysl-bpmn-process',
        name: 'BPMN Process (YSL)',
        category: 'dsl-examples',
        description: 'BPMN order process with gateways and tasks',
        tags: ['ysl', 'bpmn', 'process', 'dsl'],
        order: 8,
    },
    data: { elements: [], layers: [] },
    dslContent: `---
title: BPMN Order Process
layout: tree-right
hSpacing: 120
vSpacing: 80
---

start [start-event] "Start"
receive [task] "Receive Order"
check_stock [gateway] "In Stock?"
fulfill [task] "Fulfill Order"
backorder [task] "Place Backorder"
notify [task] "Notify Customer"
ship [task] "Ship Package"
end_ok [end-event] "Done"

start -> receive
receive -> check_stock
check_stock -> fulfill "Yes"
check_stock -> backorder "No"
backorder -> notify
fulfill -> ship
ship -> end_ok
notify -> end_ok`,
};

export const yslBpmnPoolsTemplate: Template = {
    metadata: {
        id: 'dsl-ysl-bpmn-pools',
        name: 'BPMN Swimlanes (YSL)',
        category: 'dsl-examples',
        description: 'BPMN process with pool and lane assignments',
        tags: ['ysl', 'bpmn', 'pool', 'swimlane', 'dsl'],
        order: 9,
    },
    data: { elements: [], layers: [] },
    dslContent: `---
title: BPMN with Swimlanes
layout: tree-right
---

pool sales "Sales Department"
  lane rep "Sales Rep"
  lane mgr "Manager"

pool warehouse "Warehouse"
  lane picker "Picker"
  lane shipper "Shipper"

start [start-event] "Order Received" @sales/rep
review [task] "Review Order" @sales/rep
approve [gateway] "Approved?" @sales/mgr
pick [task] "Pick Items" @warehouse/picker
pack [task] "Pack & Ship" @warehouse/shipper
reject [task] "Send Rejection" @sales/rep
end_ok [end-event] "Complete" @warehouse/shipper
end_reject [end-event] "Rejected" @sales/rep

start -> review
review -> approve
approve -> pick "Yes"
approve -> reject "No"
pick -> pack
pack -> end_ok
reject -> end_reject`,
};

export const yslUmlClassTemplate: Template = {
    metadata: {
        id: 'dsl-ysl-uml-class',
        name: 'UML Class Diagram (YSL)',
        category: 'dsl-examples',
        description: 'UML class diagram with inheritance and associations',
        tags: ['ysl', 'uml', 'class', 'dsl'],
        order: 10,
    },
    data: { elements: [], layers: [] },
    dslContent: `---
title: UML Class Diagram
layout: tree-down
hSpacing: 160
vSpacing: 120
---

animal [class] "Animal"
dog [class] "Dog"
cat [class] "Cat"
owner [class] "Owner"
vet [class] "Veterinarian"
clinic [class] "Clinic"

animal -> dog "extends"
animal -> cat "extends"
owner -> animal "owns"
vet -> animal "treats"
clinic -> vet "employs"`,
};

export const yslStyledFlowchartTemplate: Template = {
    metadata: {
        id: 'dsl-ysl-styled-flowchart',
        name: 'Styled Flowchart (YSL)',
        category: 'dsl-examples',
        description: 'Flowchart with gradients, shadows, and custom styling',
        tags: ['ysl', 'flowchart', 'styled', 'dsl'],
        order: 11,
    },
    data: { elements: [], layers: [] },
    dslContent: `---
title: Styled Flowchart
layout: tree-down
---

start [circle] "Start" { backgroundColor: "#dcfce7", strokeColor: "#16a34a", shadowEnabled: true, shadowColor: "#16a34a", shadowBlur: 12 }
input [parallelogram] "User Input" { backgroundColor: "#dbeafe", strokeColor: "#2563eb", fontFamily: "sans-serif", fontSize: 16 }
validate [decision] "Valid?" { backgroundColor: "#fef9c3", strokeColor: "#ca8a04", strokeWidth: 3 }
process [rect] "Process Data" { gradientPreset: "ocean", borderRadius: 15, textHighlightEnabled: true, textHighlightColor: "#e0e7ff" }
error [rect] "Show Error" { backgroundColor: "#fecaca", strokeColor: "#dc2626", fontWeight: true, shadowEnabled: true, shadowBlur: 8, shadowColor: "#dc2626" }
result [rect] "Display Result" { backgroundColor: "#dcfce7", strokeColor: "#16a34a", borderRadius: 20, strokeStyle: "dashed" }
end [circle] "End" { backgroundColor: "#fecaca", strokeColor: "#dc2626" }

start -> input
input -> validate
validate -> process "Yes" { strokeColor: "#16a34a", strokeWidth: 3 }
validate -> error "No" { strokeColor: "#dc2626", strokeWidth: 3 }
error -> input "Retry"
process -> result
result -> end`,
};

export const yslRadialTemplate: Template = {
    metadata: {
        id: 'dsl-ysl-radial',
        name: 'Radial Layout (YSL)',
        category: 'dsl-examples',
        description: 'Radial topic map with central hub',
        tags: ['ysl', 'radial', 'layout', 'dsl'],
        order: 12,
    },
    data: { elements: [], layers: [] },
    dslContent: `---
title: Radial Topic Map
layout: radial
---

center [circle] "DevOps"
ci [rect] "CI/CD"
monitor [rect] "Monitoring"
infra [rect] "Infrastructure"
security [rect] "Security"
collab [rect] "Collaboration"
testing [rect] "Testing"

center -> ci
center -> monitor
center -> infra
center -> security
center -> collab
center -> testing`,
};

export const yslEdgeTypesTemplate: Template = {
    metadata: {
        id: 'dsl-ysl-edge-types',
        name: 'Edge Types Demo (YSL)',
        category: 'dsl-examples',
        description: 'Arrow, line, bezier, and elbow edge types',
        tags: ['ysl', 'edges', 'demo', 'dsl'],
        order: 13,
    },
    data: { elements: [], layers: [] },
    dslContent: `---
title: Edge Types Demo
layout: tree-down
hSpacing: 200
---

a [rect] "Node A"
b [rect] "Node B"
c [rect] "Node C"
d [rect] "Node D"
e [rect] "Node E"

a -> b "arrow (->)"
a -- c "line (--)"
b ~> d "bezier (~>)"
c => e "elbow (=>)"`,
};

export const yslBottomUpTreeTemplate: Template = {
    metadata: {
        id: 'dsl-ysl-bottom-up-tree',
        name: 'Bottom-Up Org Chart (YSL)',
        category: 'dsl-examples',
        description: 'Organization chart with bottom-up tree layout',
        tags: ['ysl', 'org-chart', 'tree-up', 'dsl'],
        order: 14,
    },
    data: { elements: [], layers: [] },
    dslContent: `---
title: Bottom-Up Org Chart
layout: tree-up
hSpacing: 130
vSpacing: 80
---

ceo [rect] "CEO"
cto [rect] "CTO"
cfo [rect] "CFO"
vpe [rect] "VP Engineering"
vps [rect] "VP Sales"
dev1 [rect] "Dev Team Lead"
dev2 [rect] "QA Team Lead"
sales1 [rect] "Sales Lead"

ceo -> cto
ceo -> cfo
cto -> vpe
cfo -> vps
vpe -> dev1
vpe -> dev2
vps -> sales1`,
};

export const yslShapesShowcaseTemplate: Template = {
    metadata: {
        id: 'dsl-ysl-shapes-showcase',
        name: 'Shape Showcase (YSL)',
        category: 'dsl-examples',
        description: '20 different shape types in a grid layout',
        tags: ['ysl', 'shapes', 'showcase', 'dsl'],
        order: 15,
    },
    data: { elements: [], layers: [] },
    dslContent: `---
title: Shape Showcase
layout: grid
columns: 5
hSpacing: 140
vSpacing: 100
---

s1 [rect] "Rectangle"
s2 [circle] "Circle"
s3 [diamond] "Diamond"
s4 [triangle] "Triangle"
s5 [hexagon] "Hexagon"
s6 [star] "Star"
s7 [heart] "Heart"
s8 [cloud] "Cloud"
s9 [cylinder] "Cylinder"
s10 [capsule] "Capsule"
s11 [class] "UML Class"
s12 [actor] "Actor"
s13 [state] "State"
s14 [component] "Component"
s15 [package] "Package"
s16 [server] "Server"
s17 [db] "Database"
s18 [browser] "Browser"
s19 [firewall] "Firewall"
s20 [queue] "Queue"`,
};

export const mermaidStyledTemplate: Template = {
    metadata: {
        id: 'dsl-mermaid-styled',
        name: 'Styled Flowchart (Mermaid)',
        category: 'dsl-examples',
        description: 'Flowchart with classDef styling in Mermaid syntax',
        tags: ['mermaid', 'flowchart', 'styled'],
        order: 20,
    },
    data: { elements: [], layers: [] },
    dslContent: `flowchart LR
    A[User Request] --> B{Auth Check}
    B -->|Valid| C[Process]
    B -->|Invalid| D[Reject]
    C --> E[(Database)]
    E --> F[Response]
    D --> G[Error Page]

    classDef success fill:#dcfce7,stroke:#16a34a,color:#166534
    classDef error fill:#fecaca,stroke:#dc2626,color:#991b1b
    classDef db fill:#dbeafe,stroke:#2563eb,color:#1e40af

    class C,F success
    class D,G error
    class E db`,
};

export const mermaidStateTemplate: Template = {
    metadata: {
        id: 'dsl-mermaid-state',
        name: 'State Diagram (Mermaid)',
        category: 'dsl-examples',
        description: 'State machine with transitions in Mermaid syntax',
        tags: ['mermaid', 'state', 'diagram'],
        order: 21,
    },
    data: { elements: [], layers: [] },
    dslContent: `stateDiagram-v2
    [*] --> Idle
    Idle --> Processing : Submit
    Processing --> Validating : Validate
    Validating --> Approved : Pass
    Validating --> Rejected : Fail
    Approved --> Complete : Finalize
    Rejected --> Idle : Retry
    Complete --> [*]`,
};

export const mermaidGanttTemplate: Template = {
    metadata: {
        id: 'dsl-mermaid-gantt',
        name: 'Gantt Chart (Mermaid)',
        category: 'dsl-examples',
        description: 'Project timeline with task dependencies in Mermaid syntax',
        tags: ['mermaid', 'gantt', 'chart', 'timeline'],
        order: 22,
    },
    data: { elements: [], layers: [] },
    dslContent: `gantt
    title Product Launch Plan
    dateFormat YYYY-MM-DD
    section Planning
    Requirements     :a1, 2024-01-01, 14d
    Design Specs     :a2, after a1, 10d
    section Development
    Frontend         :b1, after a2, 21d
    Backend          :b2, after a2, 28d
    API Integration  :b3, after b1, 7d
    section Testing
    Unit Tests       :crit, c1, after b2, 10d
    QA Testing       :c2, after c1, 7d
    section Launch
    Staging Deploy   :done, d1, 2024-04-01, 3d
    Production       :d2, after c2, 2d`,
};

export const mermaidJourneyTemplate: Template = {
    metadata: {
        id: 'dsl-mermaid-journey',
        name: 'User Journey (Mermaid)',
        category: 'dsl-examples',
        description: 'User experience journey map with satisfaction scores',
        tags: ['mermaid', 'journey', 'ux'],
        order: 23,
    },
    data: { elements: [], layers: [] },
    dslContent: `journey
    title My Working Day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me, Cat
      Do work: 1: Me, Cat, Dog
    section Go home
      Go downstairs: 5: Me
      Sit down: 5: Me`,
};

export const mermaidQuadrantTemplate: Template = {
    metadata: {
        id: 'dsl-mermaid-quadrant',
        name: 'Quadrant Chart (Mermaid)',
        category: 'dsl-examples',
        description: 'Priority matrix with reach vs engagement axes',
        tags: ['mermaid', 'quadrant', 'chart', 'matrix'],
        order: 24,
    },
    data: { elements: [], layers: [] },
    dslContent: `quadrantChart
    title Reach and engagement of campaigns
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
    Campaign A: [0.3, 0.6]
    Campaign B: [0.45, 0.23]
    Campaign C: [0.57, 0.69]
    Campaign D: [0.78, 0.34]
    Campaign E: [0.40, 0.34]
    Campaign F: [0.35, 0.78]`,
};

export const mermaidXYChartTemplate: Template = {
    metadata: {
        id: 'dsl-mermaid-xychart',
        name: 'XY Chart (Mermaid)',
        category: 'dsl-examples',
        description: 'Bar and line chart with sales revenue data',
        tags: ['mermaid', 'xychart', 'bar', 'chart'],
        order: 25,
    },
    data: { elements: [], layers: [] },
    dslContent: `xychart-beta
    title "Sales Revenue"
    x-axis [Jan, Feb, Mar, Apr, May, Jun]
    y-axis "Revenue (in $)" 4000 --> 12000
    bar [5000, 6000, 7500, 8200, 9500, 10500]
    line [5000, 6000, 7500, 8200, 9500, 10500]`,
};

export const mermaidBlockTemplate: Template = {
    metadata: {
        id: 'dsl-mermaid-block',
        name: 'Block Diagram (Mermaid)',
        category: 'dsl-examples',
        description: 'Grid-based block diagram with connections',
        tags: ['mermaid', 'block', 'diagram'],
        order: 26,
    },
    data: { elements: [], layers: [] },
    dslContent: `block-beta
    columns 3
    a["Frontend"] b["API Gateway"] c["Backend"]
    d["Cache"]:2 e["Database"]
    space f["Message Queue"] space

    a --> b
    b --> c
    c --> e
    c --> d
    c --> f`,
};

export const mermaidGitGraphTemplate: Template = {
    metadata: {
        id: 'dsl-mermaid-gitgraph',
        name: 'Git Graph (Mermaid)',
        category: 'dsl-examples',
        description: 'Git branching and merge history visualization',
        tags: ['mermaid', 'git', 'graph', 'branch'],
        order: 27,
    },
    data: { elements: [], layers: [] },
    dslContent: `gitGraph
    commit id: "init"
    commit id: "feat-1"
    branch develop
    commit id: "dev-1"
    commit id: "dev-2"
    branch feature
    commit id: "feat-a"
    commit id: "feat-b" tag: "v0.1"
    checkout develop
    merge feature
    commit id: "dev-3"
    checkout main
    merge develop
    commit id: "release" tag: "v1.0"`,
};
