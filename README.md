# FlowForge - HR Workflow Designer

A modern, industrial-style visual workflow designer for HR processes. Built with React, React Flow, and Tailwind CSS.

![FlowForge Preview](public/preview.png)

## 🚀 Overview

FlowForge is a prototype HR Workflow Designer that allows administrators to visually construct, configure, and simulate complex HR processes (e.g., Onboarding, Leave Approval). It features a unique "Neo-Industrial" design language that emphasizes clarity, structure, and the "engineering" nature of workflow design.

### Key Features

- **Visual Canvas**: Drag-and-drop interface powered by React Flow.
- **Dynamic Configuration**: Context-aware configuration panels for different node types.
- **Workflow Simulation**: Built-in simulation engine to test workflow logic before deployment.
- **Industrial UI**: A distinctive, high-contrast design system optimized for complex logic visualization.
- **Validation**: Real-time structural validation to prevent invalid workflows.

## 🛠️ Architecture

### Tech Stack

- **Framework**: React 18 (Vite)
- **State Management**: Zustand (for global workflow state)
- **Canvas Engine**: React Flow (xyflow)
- **Styling**: Tailwind CSS v4 + CSS Variables
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Drag & Drop**: React DnD

### Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI primitives (Buttons, Inputs, etc.)
│   ├── workflow/     # Workflow-specific components
│   │   ├── CustomNodes.tsx    # React Flow node definitions
│   │   ├── NodeConfigPanel.tsx # Dynamic form for node editing
│   │   ├── Sidebar.tsx        # Drag-and-drop palette
│   │   ├── SimulationPanel.tsx # Execution simulator
│   │   └── WorkflowCanvas.tsx # Main canvas wrapper
├── lib/
│   ├── api.ts        # Mock API layer for simulation
│   └── utils.ts      # Helper functions
├── store/
│   └── workflowStore.ts # Zustand store for graph state
├── types/
│   └── workflow.ts   # TypeScript definitions
└── pages/
    └── Home.tsx      # Main application layout
```

### Design Decisions

1.  **Zustand for State**: Chosen over Redux or Context API for its simplicity and performance with frequent updates (dragging nodes).
2.  **Separation of Concerns**:
    *   `workflowStore` handles the *graph structure* (nodes/edges).
    *   `NodeConfigPanel` handles *node data* updates.
    *   `SimulationPanel` handles *execution logic*.
3.  **Neo-Industrial Design**:
    *   **Why?** Most HR tools are sterile. This design treats workflow building as "engineering," using raw borders, monospace fonts, and high-contrast colors to make logic flows instantly readable.
    *   **Implementation**: Custom Tailwind configuration with CSS variables for easy theming.

## 🧪 Running the Project

1.  Install dependencies:
    ```bash
    pnpm install
    ```

2.  Start the development server:
    ```bash
    pnpm dev
    ```

3.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔄 Simulation Logic

The simulation engine (`src/lib/api.ts`) performs a topological sort on the graph to determine execution order. It mocks asynchronous API calls for "Automated" nodes and provides a step-by-step execution log in the Simulation Panel.

## 📝 Future Improvements

- [ ] **Backend Integration**: Connect to a real workflow engine (e.g., Temporal.io).
- [ ] **Collaborative Editing**: Add WebSocket support for multi-user editing (using Yjs).
- [ ] **Advanced Validation**: Cycle detection and unreachable node warnings.
- [ ] **Undo/Redo**: Implement history stack for canvas actions.

---

*Built as a prototype for HR Workflow Designer assignment.*
