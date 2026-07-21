import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Box,
  CheckCircle2,
  Code2,
  Cpu,
  ExternalLink,
  FileCode2,
  GitBranch,
  Globe,
  HardDrive,
  Layers,
  Layout,
  Loader2,
  MonitorPlay,
  Network,
  Play,
  Rocket,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Smartphone,
  TerminalSquare,
  Zap
} from 'lucide-react';
import { resolveApiBase } from '../../apiBase';
import './EngineerModeV2.css';

const MEMORY_KEY = 'zaire-engineer-mode-memory-v3';
const BUILD_PHASES = ['UNDERSTAND', 'ARCHITECT', 'SCAFFOLD', 'BUILD', 'REVIEW', 'TEST', 'FIX', 'PACKAGE', 'DEPLOY'];
const PROJECT_TYPES = [
  { id: 'saas', name: 'SaaS Platform', icon: <Globe size={24} /> },
  { id: 'portfolio', name: 'Portfolio', icon: <Layout size={24} /> },
  { id: 'agent', name: 'AI Agent', icon: <Cpu size={24} /> },
  { id: 'mobile', name: 'Mobile App', icon: <Smartphone size={24} /> },
  { id: 'dashboard', name: 'Dashboard', icon: <Activity size={24} /> },
  { id: 'custom', name: 'Custom Project', icon: <Settings size={24} /> }
];

const DEFAULT_INTAKE = {
  projectType: 'saas',
  projectName: 'zaire-builder-core',
  what: 'A builder-focused product workspace for planning, coding, and shipping features.',
  who: 'Founders and product engineers shipping AI-enabled software quickly.',
  scope: 'full-stack',
  auth: 'yes',
  database: 'yes',
  payments: 'yes',
  designStyle: 'Industrial command center with premium orange accents',
  deploymentTarget: 'Vercel',
  referenceSites: 'linear.app, vercel.com, raycast.com',
  modePreference: 'pro'
};

const normalizeProjectName = (value) =>
  (value || 'zaire-builder-core')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'zaire-builder-core';

const mapWithStableKeys = (items, getBaseKey, renderItem) => {
  const seenKeys = new Map();
  return items.map((item, itemIndex) => {
    const baseKey = String(getBaseKey(item, itemIndex));
    const occurrence = seenKeys.get(baseKey) || 0;
    seenKeys.set(baseKey, occurrence + 1);
    const stableKey = occurrence === 0 ? baseKey : `${baseKey}-${occurrence}`;
    return renderItem(item, stableKey, itemIndex);
  });
};

const inferProjectTypeLabel = (projectType) =>
  PROJECT_TYPES.find((item) => item.id === projectType)?.name || 'Custom Project';

const getArchitecturePlan = (intake) => {
  const projectTypeLabel = inferProjectTypeLabel(intake.projectType);
  const isFullStack = intake.scope === 'full-stack';
  const needsAuth = intake.auth === 'yes';
  const needsDatabase = intake.database === 'yes';
  const needsPayments = intake.payments === 'yes';
  const normalizedName = normalizeProjectName(intake.projectName);
  const appName = intake.projectName || normalizedName;
  const frontendStack = ['Next.js 14 App Router', 'TypeScript', 'Tailwind CSS'];
  const backendStack = isFullStack ? ['Route Handlers', 'Server Actions', 'Node runtime'] : ['Static app shell', 'Client fetch orchestration'];
  const dataStack = needsDatabase ? ['PostgreSQL', 'Prisma ORM'] : ['No persistent database required'];
  const authStack = needsAuth ? ['Clerk authentication', 'Protected dashboard middleware'] : ['Anonymous access or lightweight session state'];
  const paymentStack = needsPayments ? ['Stripe checkout', 'Webhook-based billing sync'] : ['No payment rails required'];
  const pages = [
    'Landing / value proposition',
    'Authenticated workspace',
    'Project detail / execution view',
    ...(needsPayments ? ['Billing / plan management'] : []),
    ...(needsAuth ? ['Sign in / sign up'] : [])
  ];
  const components = [
    'ShellFrame',
    'ProjectCommandBar',
    'MissionComposer',
    'ArchitectureSummary',
    'ExecutionTimeline',
    'CodeReviewPanel',
    ...(needsPayments ? ['BillingCard'] : []),
    ...(needsAuth ? ['AuthGate'] : []),
    ...(needsDatabase ? ['DataStatusBadge'] : [])
  ];
  const apiRoutes = isFullStack
    ? [
        'POST /api/intake',
        'POST /api/architecture/approve',
        'POST /api/build',
        ...(needsPayments ? ['POST /api/billing/create-checkout', 'POST /api/billing/webhook'] : []),
        ...(needsAuth ? ['GET /api/session'] : [])
      ]
    : ['Client-side action queue only'];
  const databaseSchema = needsDatabase
    ? [
        'users(id, email, role, created_at)',
        'projects(id, owner_id, name, summary, deployment_target)',
        'decisions(id, project_id, category, decision, rationale)',
        'build_runs(id, project_id, phase, status, created_at)',
        ...(needsPayments ? ['subscriptions(id, user_id, plan, status, stripe_customer_id)'] : [])
      ]
    : ['No relational schema required for v1'];
  const authFlow = needsAuth
    ? 'Clerk handles sign-up, session issuance, and route protection before the workspace loads.'
    : 'Public landing path with optional invite capture before entering the workspace.';
  const paymentFlow = needsPayments
    ? 'Stripe Checkout creates the subscription, webhook confirms payment, and the billing record syncs into the project workspace.'
    : 'No payment flow is required in the first release.';
  const deploymentPlan = [
    `Primary hosting target: ${intake.deploymentTarget || 'Vercel'}`,
    isFullStack ? 'Run frontend and API together in the App Router deployment.' : 'Ship a frontend-only bundle with managed API integrations later if needed.',
    needsDatabase ? 'Provision PostgreSQL and attach pooled connection settings.' : 'No database provisioning needed.',
    needsAuth ? 'Configure auth redirect URLs before launch.' : 'No auth secrets required.'
  ];
  const risks = [
    isFullStack ? 'Scope can grow quickly without clear page and API boundaries.' : 'Frontend-only scope may still hide future backend dependencies.',
    needsPayments ? 'Billing webhooks and subscription state need careful testing before launch.' : 'Monetization path is still undefined for later releases.',
    needsDatabase ? 'Schema drift can slow shipping if migrations are not reviewed.' : 'Lack of persistence may limit saved workflows.',
    intake.referenceSites ? 'References should guide quality, not force feature parity.' : 'Missing references may cause design ambiguity.'
  ];
  const requiredEnvVariables = [
    'NEXT_PUBLIC_APP_URL',
    ...(needsAuth ? ['CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'] : []),
    ...(needsDatabase ? ['DATABASE_URL'] : []),
    ...(needsPayments ? ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'] : []),
    intake.deploymentTarget === 'Railway' ? 'RAILWAY_ENVIRONMENT' : 'VERCEL_ENV'
  ];
  const summary = `${appName} is a ${projectTypeLabel.toLowerCase()} for ${intake.who}. ZAIRE will ship it as a ${isFullStack ? 'full-stack' : 'frontend-first'} experience with ${needsAuth ? 'authentication' : 'no authentication'}, ${needsDatabase ? 'persistent data' : 'no database'}, and ${needsPayments ? 'payments enabled' : 'no payments in v1'}.`;
  const assumptions = [
    `Primary target user remains ${intake.who}.`,
    intake.referenceSites ? `Reference sites are inspiration, not exact clones: ${intake.referenceSites}.` : 'No direct reference websites were provided.',
    isFullStack ? 'Server-side logic is allowed in the first release.' : 'Backend scope stays deferred unless new requirements appear.',
    `Deployment will start on ${intake.deploymentTarget || 'Vercel'}.`
  ];

  return {
    summary,
    assumptions,
    projectTypeLabel,
    normalizedName,
    appName,
    isFullStack,
    needsAuth,
    needsDatabase,
    needsPayments,
    techStack: [...frontendStack, ...backendStack, ...dataStack, ...authStack, ...paymentStack],
    pages,
    components,
    apiRoutes,
    databaseSchema,
    authFlow,
    paymentFlow,
    deploymentPlan,
    risks,
    requiredEnvVariables
  };
};

const getFileArtifacts = (plan, intake, skillLevel) => {
  const files = {
    'app/page.tsx': {
      content: `export default function Page() {\n  return (\n    <main className="min-h-screen bg-black text-white">\n      <section className="mx-auto max-w-6xl px-6 py-24">\n        <h1 className="text-5xl font-semibold tracking-tight">${plan.appName}</h1>\n        <p className="mt-4 max-w-2xl text-zinc-400">\n          ${intake.what}\n        </p>\n      </section>\n    </main>\n  );\n}\n`,
      explanation: {
        what: 'This is the launch page for the product experience.',
        why: 'Every project needs a reliable entry route that expresses value immediately.',
        edit: 'Hero copy, section order, and call-to-action text are safe to change.',
        protect: 'Keep the exported page contract and core layout shell intact.'
      }
    },
    'app/(workspace)/dashboard/page.tsx': {
      content: `export default function DashboardPage() {\n  return (\n    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">\n      <section className="rounded-2xl border border-white/10 p-6">\n        <h2 className="text-2xl font-semibold">Execution Workspace</h2>\n        <p className="mt-3 text-sm text-zinc-400">\n          Track architecture decisions, build phases, and QA readiness in one view.\n        </p>\n      </section>\n    </div>\n  );\n}\n`,
      explanation: {
        what: 'This file renders the logged-in workspace used for execution.',
        why: 'It gives engineers a focused place to act after landing.',
        edit: 'Cards, data modules, and supporting copy are safe to adapt.',
        protect: 'Avoid removing the route or changing the workspace contract without updating navigation.'
      }
    }
  };

  if (plan.needsAuth) {
    files['middleware.ts'] = {
      content: `import { clerkMiddleware } from "@clerk/nextjs/server";\n\nexport default clerkMiddleware();\n\nexport const config = {\n  matcher: ["/((?!_next|.*\\\\..*).*)"]\n};\n`,
      explanation: {
        what: 'This secures application routes with auth middleware.',
        why: 'Protected screens should not render before session checks succeed.',
        edit: 'You can refine which routes are protected.',
        protect: 'Do not remove the middleware export unless you remove auth completely.'
      }
    };
  }

  if (plan.needsDatabase) {
    files['prisma/schema.prisma'] = {
      content: `generator client {\n  provider = "prisma-client-js"\n}\n\ndatasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\nmodel Project {\n  id               String   @id @default(cuid())\n  name             String\n  summary          String\n  deploymentTarget String\n  createdAt        DateTime @default(now())\n}\n`,
      explanation: {
        what: 'This defines the database schema for project memory and execution records.',
        why: 'Persistent state keeps the workflow coherent between sessions.',
        edit: 'Adding fields and related models is normal as the product grows.',
        protect: 'Coordinate schema changes with migrations so data stays consistent.'
      }
    };
  }

  if (plan.isFullStack) {
    files['app/api/build/route.ts'] = {
      content: `import { NextResponse } from "next/server";\n\nexport async function POST() {\n  return NextResponse.json({\n    status: "queued",\n    phase: "${skillLevel === 'PROFESSIONAL' ? 'BUILD' : 'SCAFFOLD'}"\n  });\n}\n`,
      explanation: {
        what: 'This route receives build orchestration requests.',
        why: 'The workflow needs a backend handoff point for execution events.',
        edit: 'Response shape and orchestration details can evolve with your build system.',
        protect: 'Keep the route stable if the frontend depends on its status contract.'
      }
    };
  }

  if (plan.needsPayments) {
    files['app/api/billing/create-checkout/route.ts'] = {
      content: `import { NextResponse } from "next/server";\n\nexport async function POST() {\n  return NextResponse.json({ checkoutUrl: "https://checkout.stripe.com/session/demo" });\n}\n`,
      explanation: {
        what: 'This route creates the billing checkout handoff.',
        why: 'Payment initiation should stay server-side so secrets remain protected.',
        edit: 'Swap the demo response with the live Stripe session call.',
        protect: 'Do not expose secret keys or move checkout creation into client code.'
      }
    };
  }

  return files;
};

const normalizeBackendPlan = (plan) => {
  if (!plan) return null;

  return {
    summary: plan.summary,
    assumptions: plan.assumptions || [],
    projectTypeLabel: plan.projectTypeLabel || 'Custom Project',
    normalizedName: plan.normalizedName || normalizeProjectName(plan.appName || ''),
    appName: plan.appName || plan.normalizedName || 'zaire-builder-core',
    isFullStack: typeof plan.isFullStack === 'boolean' ? plan.isFullStack : false,
    needsAuth: typeof plan.needsAuth === 'boolean' ? plan.needsAuth : false,
    needsDatabase: typeof plan.needsDatabase === 'boolean' ? plan.needsDatabase : false,
    needsPayments: typeof plan.needsPayments === 'boolean' ? plan.needsPayments : false,
    techStack: plan.stack || plan.techStack || [],
    pages: plan.pages || [],
    components: plan.components || [],
    apiRoutes: plan.apiRoutes || [],
    databaseSchema: plan.databaseSchema || [],
    authFlow: plan.authFlow || 'No auth flow specified.',
    paymentFlow: plan.paymentFlow || 'No payment flow specified.',
    deploymentPlan: plan.deploymentPlan || [],
    risks: plan.risks || [],
    requiredEnvVariables: plan.envVars || plan.requiredEnvVariables || []
  };
};

const normalizeBackendScaffold = (scaffold) => {
  if (!scaffold) return null;

  const normalizedFiles = { ...(scaffold.files || {}) };

  if (scaffold.readme) {
    normalizedFiles['README.md'] = {
      content: scaffold.readme,
      explanation: {
        what: 'This README introduces the generated project and launch steps.',
        why: 'Every scaffold should explain how to start, understand, and ship the project.',
        edit: 'Project overview, setup steps, and usage notes are safe to edit.',
        protect: 'Keep the key startup steps accurate as the project evolves.'
      }
    };
  }

  if (scaffold.envExample) {
    normalizedFiles['.env.example'] = {
      content: scaffold.envExample,
      explanation: {
        what: 'This file lists the environment variables required by the generated scaffold.',
        why: 'It helps the project boot with the right auth, data, and billing configuration.',
        edit: 'Add or remove variables as the architecture changes.',
        protect: 'Do not put real secrets into the example file.'
      }
    };
  }

  if (scaffold.packageConfig) {
    normalizedFiles['package.json'] = {
      content: JSON.stringify(scaffold.packageConfig, null, 2),
      explanation: {
        what: 'This is the package manifest for the generated app.',
        why: 'It defines scripts and dependencies needed to run the scaffold.',
        edit: 'Dependencies and scripts can evolve with the project.',
        protect: 'Keep required runtime dependencies aligned with the generated files.'
      }
    };
  }

  return normalizedFiles;
};

const getFieldProps = (scope, field) => ({
  id: `${scope}-${field}`,
  name: `${scope}-${field}`
});

const postEngineerWorkflow = async (path, payload) => {
  const response = await fetch(`${resolveApiBase()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
};

const getQaChecks = (plan, intake, repairFlow) => {
  const checks = [
    {
      label: 'Dependency check',
      status: 'PASSED',
      detail: 'Core runtime, UI, and workflow dependencies are aligned with the selected stack.',
      fix: 'No action required.'
    },
    {
      label: 'Build check',
      status: 'PASSED',
      detail: 'Project structure is compatible with the chosen App Router deployment path.',
      fix: 'Keep route and layout exports stable.'
    },
    {
      label: 'Lint check',
      status: 'WARNING',
      detail: skillLevelCopy(intake.modePreference || 'pro', 'A few naming and formatting issues may appear during the first scaffold.', 'A first scaffold pass still needs lint cleanup before merge.'),
      fix: 'Run lint after scaffold and normalize imports, naming, and JSX structure.'
    },
    {
      label: 'Missing env check',
      status: 'WARNING',
      detail: `${plan.requiredEnvVariables.length} environment variables must be supplied before production deploy.`,
      fix: `Set ${plan.requiredEnvVariables.join(', ')} in the hosting platform.`
    },
    {
      label: 'Route check',
      status: 'PASSED',
      detail: `${plan.pages.length} page routes and ${plan.apiRoutes.length} API surfaces are accounted for.`,
      fix: 'No action required.'
    },
    {
      label: 'Security check',
      status: plan.needsAuth ? 'PASSED' : 'WARNING',
      detail: plan.needsAuth ? 'Authentication boundary is included in the architecture.' : 'No auth layer is planned, so sensitive actions should remain limited.',
      fix: plan.needsAuth ? 'Validate redirect URLs and session protection before launch.' : 'Add auth before exposing private workspace data.'
    }
  ];

  if (repairFlow?.approved) {
    checks.push({
      label: 'Repair retest',
      status: 'PASSED',
      detail: `Patch applied to ${repairFlow.likelyFile} and queued for verification.`,
      fix: 'No action required.'
    });
  }

  const passed = checks.filter((item) => item.status === 'PASSED').length;
  const warnings = checks.filter((item) => item.status === 'WARNING').length;
  const errors = checks.filter((item) => item.status === 'ERROR').length;

  return { checks, passed, warnings, errors };
};

const getDeployReport = (plan, qa) => {
  const deploymentPlan = Array.isArray(plan.deploymentPlan) ? plan.deploymentPlan : [];
  const requiredEnvVariables = Array.isArray(plan.requiredEnvVariables) ? plan.requiredEnvVariables : [];
  const firstDeploymentLine = deploymentPlan[0] || 'Primary hosting target: Not specified';

  return {
    hostingTarget: firstDeploymentLine.replace('Primary hosting target: ', ''),
    requiredEnvVariables,
    databaseRequired: plan.needsDatabase ? 'YES' : 'NO',
    authRequired: plan.needsAuth ? 'YES' : 'NO',
    paymentRequired: plan.needsPayments ? 'YES' : 'NO',
    readyStatus: qa.errors === 0 ? 'READY' : 'BLOCKED',
    nextSteps: [
      'Add required environment variables to the host.',
      plan.needsDatabase ? 'Run the first Prisma migration and confirm connection pooling.' : 'Confirm persistence can stay out of v1.',
      plan.needsPayments ? 'Switch billing routes from demo to live Stripe credentials.' : 'No payment setup required.',
      'Run lint/build checks in CI before launch.'
    ]
  };
};

const skillLevelCopy = (modePreference, beginnerText, proText) =>
  modePreference === 'beginner' ? beginnerText : proText;

const getBeginnerPhaseExplanation = (phase) => {
  const phaseCopy = {
    UNDERSTAND: 'ZAIRE is clarifying the product goal and user before any code is written.',
    ARCHITECT: 'ZAIRE is turning your answers into a safe build plan.',
    SCAFFOLD: 'ZAIRE is organizing the files, pages, and building blocks.',
    BUILD: 'ZAIRE is generating the main product code and connecting the system.',
    REVIEW: 'ZAIRE is checking whether the generated work still matches the plan.',
    TEST: 'ZAIRE is running quality and safety checks before release.',
    FIX: 'ZAIRE found something risky and is preparing a correction.',
    PACKAGE: 'ZAIRE is preparing the project for shipping.',
    DEPLOY: 'ZAIRE is validating what is needed to go live.'
  };

  return phaseCopy[phase] || 'ZAIRE is working through the engineering workflow.';
};

const getAgentContributions = (plan, qaReport, currentPhase, repairFlow) => [
  {
    agent: 'Architect Agent',
    summary: `Locked ${plan.projectTypeLabel.toLowerCase()} scope with ${plan.pages.length} launch pages for ${plan.appName}.`
  },
  {
    agent: 'UI Engineer',
    summary: `Mapped ${plan.components.length} interface blocks to the selected ${plan.techStack[0]} stack.`
  },
  {
    agent: 'Backend Engineer',
    summary: plan.isFullStack ? `Prepared ${plan.apiRoutes.length} API surfaces with ${plan.needsAuth ? 'auth-aware' : 'public'} execution flow.` : 'Backend scope is intentionally deferred for this release.'
  },
  {
    agent: 'Security Auditor',
    summary: plan.needsAuth ? 'Tracking protected routes, secret usage, and deploy boundary checks.' : 'Monitoring the public surface for launch risk.'
  },
  {
    agent: 'QA Tester',
    summary: `${qaReport.passed} checks passed, ${qaReport.warnings} warnings open${repairFlow ? ', repair flow active.' : '.'}`
  }
];

const getRepairPlan = (message, plan) => {
  const lower = message.toLowerCase();
  const missingEnv = lower.includes('env') || lower.includes('environment');
  const authError = lower.includes('auth') || lower.includes('401') || lower.includes('unauthorized');
  const routeError = lower.includes('route') || lower.includes('404') || lower.includes('endpoint');
  const buildError = lower.includes('build') || lower.includes('compile');

  let likelyFile = 'app/page.tsx';
  let category = 'runtime';
  let cause = 'A generated route or component likely drifted from the approved architecture.';
  let patch = 'Normalize the exported contract and re-run the affected check.';

  if (missingEnv) {
    likelyFile = '.env.local';
    category = 'configuration';
    cause = 'A required environment variable is missing for the selected deployment path.';
    patch = `Add ${plan.requiredEnvVariables.join(', ')} and re-run the environment validation pass.`;
  } else if (authError) {
    likelyFile = 'middleware.ts';
    category = 'authentication';
    cause = 'The auth boundary is blocking a request before session state is established.';
    patch = 'Confirm redirect URLs, protected route matching, and auth middleware order.';
  } else if (routeError) {
    likelyFile = 'app/api/build/route.ts';
    category = 'routing';
    cause = 'The frontend is calling an API route that is missing or mismatched.';
    patch = 'Restore the expected route handler and align the response contract.';
  } else if (buildError) {
    likelyFile = 'app/page.tsx';
    category = 'build';
    cause = 'The scaffold likely has a compile-time syntax or import issue.';
    patch = 'Tighten imports, JSX boundaries, and route exports before rebuilding.';
  }

  return {
    category,
    likelyFile,
    cause,
    patch,
    approved: false
  };
};

const loadMemory = () => {
  try {
    const raw = window.localStorage.getItem(MEMORY_KEY);
    if (!raw) {
      return {
        intake: DEFAULT_INTAKE,
        approvedArchitecture: null,
        currentPhase: 'UNDERSTAND',
        phaseHistory: ['UNDERSTAND'],
        agentNotes: [],
        generatedFiles: [],
        deploymentTarget: DEFAULT_INTAKE.deploymentTarget,
        decisions: [],
        errors: [],
        fixes: [],
        knownIssues: [],
        routes: [],
        components: []
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      intake: DEFAULT_INTAKE,
      approvedArchitecture: null,
      currentPhase: 'UNDERSTAND',
      phaseHistory: ['UNDERSTAND'],
      agentNotes: [],
      generatedFiles: [],
      deploymentTarget: DEFAULT_INTAKE.deploymentTarget,
      decisions: [],
      errors: [],
      fixes: [],
      knownIssues: [],
      routes: [],
      components: []
    };
  }
};

const EngineerModeV2 = () => {
  const persistedMemory = useMemo(() => loadMemory(), []);
  const [activeStage, setActiveStage] = useState(1);
  const [skillLevel, setSkillLevel] = useState((persistedMemory.intake?.modePreference || DEFAULT_INTAKE.modePreference).toUpperCase());
  const [directiveInput, setDirectiveInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [cmdSuccess, setCmdSuccess] = useState(false);
  const [intakeAnswers, setIntakeAnswers] = useState({ ...DEFAULT_INTAKE, ...(persistedMemory.intake || {}) });
  const [, setArchitectureApproved] = useState(false);
  const [designBrief, setDesignBrief] = useState(null);
  const [backendPlan, setBackendPlan] = useState(null);
  const [backendScaffold, setBackendScaffold] = useState(null);
  const [buildSubPhase, setBuildSubPhase] = useState('UNDERSTAND');
  const [commandStatus, setCommandStatus] = useState('Structured intake loaded. Engineer workflow is ready.');
  const [projectMemory, setProjectMemory] = useState({
    approvedArchitecture: persistedMemory.approvedArchitecture || null,
    currentPhase: persistedMemory.currentPhase || 'UNDERSTAND',
    phaseHistory: persistedMemory.phaseHistory || ['UNDERSTAND'],
    agentNotes: persistedMemory.agentNotes || [],
    generatedFiles: persistedMemory.generatedFiles || [],
    deploymentTarget: persistedMemory.deploymentTarget || DEFAULT_INTAKE.deploymentTarget,
    decisions: persistedMemory.decisions || [],
    errors: persistedMemory.errors || [],
    fixes: persistedMemory.fixes || [],
    knownIssues: persistedMemory.knownIssues || [],
    routes: persistedMemory.routes || [],
    components: persistedMemory.components || []
  });
  const [repairFlow, setRepairFlow] = useState(null);
  const [buildLogs, setBuildLogs] = useState([]);
  const [deployLogs, setDeployLogs] = useState([]);
  const [, setActiveComponent] = useState('ShellFrame');
  const [activeFile, setActiveFile] = useState('app/page.tsx');
  const [openFiles, setOpenFiles] = useState(['app/page.tsx', 'app/(workspace)/dashboard/page.tsx']);
  const buildInterval = useRef(null);
  const deployInterval = useRef(null);

  const localArchitecturePlan = useMemo(() => getArchitecturePlan(intakeAnswers), [intakeAnswers]);
  const architecturePlan = backendPlan || localArchitecturePlan;
  const localFileArtifacts = useMemo(() => getFileArtifacts(architecturePlan, intakeAnswers, skillLevel), [architecturePlan, intakeAnswers, skillLevel]);
  const fileArtifacts = backendScaffold || localFileArtifacts;
  const fileNames = useMemo(() => Object.keys(fileArtifacts), [fileArtifacts]);
  const qaReport = useMemo(() => getQaChecks(architecturePlan, intakeAnswers, repairFlow), [architecturePlan, intakeAnswers, repairFlow]);
  const deployReport = useMemo(() => getDeployReport(architecturePlan, qaReport), [architecturePlan, qaReport]);

  const currentPhase = useMemo(() => {
    if (activeStage === 1) return 'UNDERSTAND';
    if (activeStage === 2) return 'ARCHITECT';
    if (activeStage === 3) return 'SCAFFOLD';
    if (activeStage === 4) return buildSubPhase;
    return 'DEPLOY';
  }, [activeStage, buildSubPhase]);
  const phaseIndex = BUILD_PHASES.indexOf(currentPhase);
  const phaseTimeline = BUILD_PHASES.map((phase, index) => ({
    phase,
    active: phase === currentPhase,
    completed: index < phaseIndex
  }));
  const agentContributions = useMemo(() => getAgentContributions(architecturePlan, qaReport, currentPhase, repairFlow), [architecturePlan, qaReport, currentPhase, repairFlow]);

  const commandMetrics = [
    // { label: 'Launch Focus', value: 'Engineer Core' },
    // { label: 'Current Phase', value: currentPhase },
    // { label: 'Memory State', value: `${projectMemory.decisions.length + projectMemory.fixes.length + projectMemory.agentNotes.length} Signals` },
    // { label: 'Deployment Path', value: deployReport.hostingTarget }
  ];

  const workspaceSignals = [
    { label: 'Primary Value', value: 'Build software faster' },
    { label: 'Current Phase', value: currentPhase },
    { label: 'Current Mode', value: skillLevel }
  ];

  const topologyNodes = [
    `Frontend: ${architecturePlan.techStack[0]}`,
    architecturePlan.isFullStack ? 'API: Route Handlers' : 'API: Not required in v1',
    architecturePlan.needsDatabase ? 'Data: PostgreSQL + Prisma' : 'Data: No database required'
  ];

  const aiTeam = useMemo(() => {
    const isBuild = ['BUILD', 'REVIEW', 'TEST', 'FIX', 'PACKAGE'].includes(currentPhase);
    return [
      { name: 'Architect Agent', status: ['UNDERSTAND', 'ARCHITECT'].includes(currentPhase) ? 'Planning' : 'Complete', active: ['UNDERSTAND', 'ARCHITECT'].includes(currentPhase), mem: '86%', note: architecturePlan.projectTypeLabel },
      { name: 'UI Engineer', status: activeStage >= 3 ? 'Scaffolding' : 'Waiting', active: activeStage === 3 || currentPhase === 'BUILD', mem: '76%', note: architecturePlan.components[0] },
      { name: 'Backend Engineer', status: architecturePlan.isFullStack ? (isBuild ? 'Building' : activeStage >= 2 ? 'Ready' : 'Waiting') : 'Not Needed', active: architecturePlan.isFullStack && currentPhase === 'BUILD', mem: '72%', note: architecturePlan.apiRoutes[0] || 'Client only' },
      { name: 'Database Engineer', status: architecturePlan.needsDatabase ? (activeStage >= 2 ? 'Schema Ready' : 'Waiting') : 'Not Needed', active: architecturePlan.needsDatabase && currentPhase === 'ARCHITECT', mem: '64%', note: architecturePlan.databaseSchema[0] },
      { name: 'Security Auditor', status: activeStage >= 4 ? 'Reviewing' : 'Waiting', active: currentPhase === 'REVIEW' || currentPhase === 'TEST', mem: '58%', note: architecturePlan.needsAuth ? 'Auth checks enabled' : 'Public workflow' },
      { name: 'QA Tester', status: activeStage >= 4 ? (qaReport.errors ? 'Blocked' : 'Passed') : 'Waiting', active: currentPhase === 'TEST', mem: '67%', note: `${qaReport.passed} passed / ${qaReport.warnings} warnings` },
      { name: 'Deployment Engineer', status: activeStage === 5 ? deployReport.readyStatus : 'Waiting', active: currentPhase === 'DEPLOY', mem: '81%', note: deployReport.hostingTarget }
    ];
  }, [activeStage, architecturePlan, currentPhase, deployReport, qaReport]);

  const activeFileArtifact = fileArtifacts[activeFile] || fileArtifacts[fileNames[0]];
  const activeFileExplanation = activeFileArtifact?.explanation;

  const handleDownloadZip = async () => {
    if (!fileArtifacts || Object.keys(fileArtifacts).length === 0) return;
    setIsProcessing(true);
    setCommandStatus('Generating ZIP file...');
    try {
      const filesArr = Object.keys(fileArtifacts).map(path => ({
        path,
        content: fileArtifacts[path].content
      }));
      const response = await fetch(`${resolveApiBase()}/engineer/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'local-test-123',
          files: filesArr
        })
      });
      
      if (!response.ok) {
        throw new Error('Export failed on server');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${intakeAnswers.projectName || 'zaire-project'}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      setCommandStatus('ZIP downloaded successfully.');
    } catch (error) {
      console.error('Download ZIP error:', error);
      setCommandStatus('Failed to download ZIP: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const advanceStage = (nextStage, text, nextPhase) => {
    setIsProcessing(true);
    setLoadingText(text);
    setTimeout(() => {
      setIsProcessing(false);
      if (nextPhase) {
        setBuildSubPhase(nextPhase);
      }
      setActiveStage(nextStage);
    }, 900);
  };

  const updateMemory = (nextPartial) => {
    setProjectMemory((prev) => {
      const next = { ...prev, ...nextPartial };
      window.localStorage.setItem(
        MEMORY_KEY,
        JSON.stringify({
          intake: intakeAnswers,
          approvedArchitecture: next.approvedArchitecture,
          currentPhase: next.currentPhase,
          phaseHistory: next.phaseHistory,
          agentNotes: next.agentNotes,
          generatedFiles: next.generatedFiles,
          deploymentTarget: next.deploymentTarget,
          decisions: next.decisions,
          errors: next.errors,
          fixes: next.fixes,
          knownIssues: next.knownIssues,
          routes: next.routes,
          components: next.components
        })
      );
      return next;
    });
  };

  useEffect(() => {
    window.localStorage.setItem(
      MEMORY_KEY,
      JSON.stringify({
        intake: intakeAnswers,
        approvedArchitecture: projectMemory.approvedArchitecture,
        currentPhase: currentPhase,
        phaseHistory: projectMemory.phaseHistory,
        agentNotes: projectMemory.agentNotes,
        generatedFiles: fileNames,
        deploymentTarget: intakeAnswers.deploymentTarget,
        decisions: projectMemory.decisions,
        errors: projectMemory.errors,
        fixes: projectMemory.fixes,
        knownIssues: projectMemory.knownIssues,
        routes: architecturePlan.pages,
        components: architecturePlan.components
      })
    );
  }, [architecturePlan.components, architecturePlan.pages, currentPhase, fileNames, intakeAnswers, projectMemory.agentNotes, projectMemory.approvedArchitecture, projectMemory.decisions, projectMemory.errors, projectMemory.fixes, projectMemory.knownIssues, projectMemory.phaseHistory]);

  useEffect(() => {
    setProjectMemory((prev) => ({
      ...prev,
      currentPhase,
      deploymentTarget: intakeAnswers.deploymentTarget,
      generatedFiles: fileNames
    }));
  }, [currentPhase, fileNames, intakeAnswers.deploymentTarget]);

  useEffect(() => {
    setProjectMemory((prev) => {
      if (prev.phaseHistory[prev.phaseHistory.length - 1] === currentPhase) {
        return prev;
      }

      return {
        ...prev,
        phaseHistory: [...prev.phaseHistory, currentPhase].slice(-18)
      };
    });
  }, [currentPhase]);

  useEffect(() => {
    setProjectMemory((prev) => ({
      ...prev,
      agentNotes: agentContributions.map((item) => `${item.agent}: ${item.summary}`)
    }));
  }, [agentContributions]);

  useEffect(() => {
    setOpenFiles(fileNames.slice(0, Math.min(3, fileNames.length)));
    setActiveFile((current) => (fileArtifacts[current] ? current : fileNames[0]));
  }, [fileArtifacts, fileNames]);

  useEffect(() => {
    setActiveComponent((current) => (architecturePlan.components.includes(current) ? current : architecturePlan.components[0]));
  }, [architecturePlan.components]);

  useEffect(() => {
    setBuildSubPhase(activeStage === 5 ? 'DEPLOY' : activeStage === 4 ? 'BUILD' : activeStage === 3 ? 'DESIGN' : activeStage === 2 ? 'ARCHITECT' : 'UNDERSTAND');
  }, [activeStage]);

  useEffect(() => {
    if (activeStage !== 4) {
      clearInterval(buildInterval.current);
      return undefined;
    }

    const phases = qaReport.errors > 0 ? ['BUILD', 'REVIEW', 'TEST', 'FIX'] : ['BUILD', 'REVIEW', 'TEST', 'PACKAGE'];
    const logs = [
      `zaire@system:~$ engineer build ${architecturePlan.normalizedName}`,
      `> intake validated for ${architecturePlan.projectTypeLabel}`,
      `> approved architecture loaded with ${architecturePlan.pages.length} pages and ${architecturePlan.components.length} components`
    ];
    setBuildLogs(logs);

    let step = 0;
    buildInterval.current = setInterval(() => {
      if (step >= phases.length) {
        clearInterval(buildInterval.current);
        return;
      }

      const phase = phases[step];
      setBuildSubPhase(phase);
      setBuildLogs((prev) => [
        ...prev,
        `> phase:${phase.toLowerCase()} :: ${phase === 'BUILD' ? 'scaffolding routes and core components' : phase === 'REVIEW' ? 'multi-agent review in progress' : phase === 'TEST' ? 'automatic QA suite executed' : phase === 'FIX' ? 'repair approval required before packaging' : 'package assembled for deployment'}`
      ]);
      step += 1;
    }, 800);

    return () => clearInterval(buildInterval.current);
  }, [activeStage, architecturePlan.components.length, architecturePlan.pages.length, architecturePlan.projectTypeLabel, architecturePlan.normalizedName, qaReport.errors]);

  useEffect(() => {
    if (activeStage !== 5) {
      clearInterval(deployInterval.current);
      return undefined;
    }

    const logs = [
      `INFO Hosting target resolved: ${deployReport.hostingTarget}`,
      `INFO Ready status: ${deployReport.readyStatus}`
    ];
    setDeployLogs(logs);
    let step = 0;
    const lines = [
      `CHECK Env vars required: ${deployReport.requiredEnvVariables.join(', ')}`,
      `CHECK Database required: ${deployReport.databaseRequired}`,
      `CHECK Auth required: ${deployReport.authRequired}`,
      `CHECK Payments required: ${deployReport.paymentRequired}`,
      `NEXT ${deployReport.nextSteps[0]}`,
      `NEXT ${deployReport.nextSteps[1]}`,
      'DEPLOYMENT REPORT COMPLETE'
    ];

    deployInterval.current = setInterval(() => {
      if (step >= lines.length) {
        clearInterval(deployInterval.current);
        return;
      }
      setDeployLogs((prev) => [...prev, lines[step]]);
      step += 1;
    }, 650);

    return () => clearInterval(deployInterval.current);
  }, [activeStage, deployReport]);

  const handleIntakeChange = (field, value) => {
    setIntakeAnswers((prev) => ({ ...prev, [field]: value }));
  };

  const handleModeToggle = (mode) => {
    setSkillLevel(mode);
    setIntakeAnswers((prev) => ({ ...prev, modePreference: mode.toLowerCase() }));
  };

  const handleGenerateArchitecture = () => {
    if (!intakeAnswers.what.trim() || !intakeAnswers.who.trim() || !intakeAnswers.deploymentTarget.trim()) {
      setCommandStatus('Complete the product, audience, and deployment questions before architecture generation.');
      return;
    }

    const run = async () => {
      let nextPlan = localArchitecturePlan;
      let usedFallback = false;

      setIsProcessing(true);
      setLoadingText('Generating architecture plan...');
      setArchitectureApproved(false);
      setBackendPlan(null);
      setBackendScaffold(null);

      try {
        const result = await postEngineerWorkflow('/engineer/plan', { intake: intakeAnswers });
        const normalized = normalizeBackendPlan(result?.plan);
        if (normalized) {
          nextPlan = normalized;
          setBackendPlan(normalized);
        } else {
          usedFallback = true;
        }
      } catch (error) {
        usedFallback = true;
      }

      updateMemory({
        approvedArchitecture: null,
        currentPhase: 'ARCHITECT',
        phaseHistory: [...projectMemory.phaseHistory, 'ARCHITECT'].slice(-18),
        generatedFiles: [],
        deploymentTarget: intakeAnswers.deploymentTarget,
        decisions: [
          ...projectMemory.decisions,
          `Intake captured for ${intakeAnswers.projectName} targeting ${intakeAnswers.deploymentTarget}.`
        ],
        knownIssues: [],
        routes: nextPlan.pages,
        components: nextPlan.components
      });

      setTimeout(() => {
        setIsProcessing(false);
        setBuildSubPhase('ARCHITECT');
        setActiveStage(2);
      }, 900);

      setCommandStatus(
        usedFallback
          ? 'Backend plan was unavailable. Local architecture plan generated as fallback.'
          : 'Architecture plan generated. Review it before build starts.'
      );
    };

    run();
  };

  const handleApproveArchitecture = () => {
    const run = async () => {
      let usedFallback = false;

      setIsProcessing(true);
      setLoadingText('Scaffolding approved structure...');

      try {
        const result = await postEngineerWorkflow('/engineer/design-brief', {
          projectId: 'local-test-123',
          intake: intakeAnswers,
          plan: architecturePlan
        });
        if (result && result.brief) {
          setDesignBrief(result.brief);
        } else {
          usedFallback = true;
        }
      } catch (error) {
        usedFallback = true;
        console.error('Design brief generation error:', error);
      }

      setArchitectureApproved(true);
      updateMemory({
        approvedArchitecture: architecturePlan,
        currentPhase: 'DESIGN',
        phaseHistory: [...projectMemory.phaseHistory, 'DESIGN'].slice(-18),
        agentNotes: agentContributions.map((item) => `${item.agent}: ${item.summary}`),
        deploymentTarget: intakeAnswers.deploymentTarget,
        decisions: [
          ...projectMemory.decisions,
          `Architecture approved with ${architecturePlan.techStack[0]} and ${architecturePlan.pages.length} core pages.`
        ],
        routes: architecturePlan.pages,
        components: architecturePlan.components
      });

      setTimeout(() => {
        setIsProcessing(false);
        setBuildSubPhase('DESIGN');
        setActiveStage(3);
      }, 900);

      setCommandStatus(
        usedFallback
          ? 'Backend design intelligence was unavailable. Using fallback design logic.'
          : 'Architecture approved. ZAIRE is generating Design Intelligence Brief.'
      );
    };

    run();
  };

  const handleApproveDesign = () => {
    const run = async () => {
      setIsProcessing(true);
      setLoadingText('Scaffolding approved structure...');
      let usedFallback = false;

      try {
        const result = await postEngineerWorkflow('/engineer/scaffold', {
          plan: architecturePlan,
          designBrief: designBrief,
          intake: intakeAnswers,
          skillLevel,
          projectId: 'local-test-123'
        });

        const normalized = normalizeBackendScaffold(result?.scaffold);
        if (normalized && Object.keys(normalized).length > 0) {
          setBackendScaffold(normalized);
          updateMemory({
            currentPhase: 'BUILD',
            phaseHistory: [...projectMemory.phaseHistory, 'BUILD'].slice(-18),
            generatedFiles: Object.keys(normalized),
            decisions: [
              ...projectMemory.decisions,
              `Design Brief approved.`
            ]
          });
        } else {
          usedFallback = true;
        }
      } catch (error) {
        usedFallback = true;
        console.error('Scaffold error:', error);
      }

      if (usedFallback) {
        updateMemory({
          currentPhase: 'BUILD',
          phaseHistory: [...projectMemory.phaseHistory, 'BUILD'].slice(-18),
          generatedFiles: Object.keys(localFileArtifacts),
          decisions: [
            ...projectMemory.decisions,
            `Design Brief approved.`
          ]
        });
      }

      setIsProcessing(false);
      setBuildSubPhase('BUILD');
      setActiveStage(4);

      setCommandStatus(
        usedFallback
          ? 'Backend scaffold was unavailable. Local scaffold generated as fallback.'
          : 'Design approved. ZAIRE is moving into QA repair phase.'
      );
    };

    run();
  };

  const handleRegenerateDesign = () => {
    const run = async () => {
      setIsProcessing(true);
      setLoadingText('Regenerating Design Intelligence brief...');
      try {
        const result = await postEngineerWorkflow('/engineer/design-brief/regenerate', {
          projectId: 'local-test-123',
          intake: intakeAnswers
        });
        if (result && result.designBrief) {
          setDesignBrief(result.designBrief);
          setCommandStatus('Design Brief regenerated. Review and approve to continue.');
        }
      } catch (error) {
        setCommandStatus(`Regeneration failed: ${error.message}`);
      } finally {
        setIsProcessing(false);
      }
    };
    run();
  };

  const handleEditPlan = () => {
    setArchitectureApproved(false);
    setBackendPlan(null);
    setBackendScaffold(null);
    setActiveStage(1);
    setBuildSubPhase('UNDERSTAND');
    updateMemory({
      currentPhase: 'UNDERSTAND',
      phaseHistory: [...projectMemory.phaseHistory, 'UNDERSTAND'].slice(-18),
      approvedArchitecture: null
    });
    setCommandStatus('Architecture returned to intake for edits. Update the answers, then regenerate the plan.');
  };

  const handleCancelPlan = () => {
    setArchitectureApproved(false);
    setBackendPlan(null);
    setBackendScaffold(null);
    setRepairFlow(null);
    setBuildLogs([]);
    setDeployLogs([]);
    setActiveStage(1);
    setBuildSubPhase('UNDERSTAND');
    updateMemory({
      approvedArchitecture: null,
      currentPhase: 'UNDERSTAND',
      phaseHistory: [...projectMemory.phaseHistory, 'UNDERSTAND'].slice(-18),
      generatedFiles: [],
      knownIssues: []
    });
    setCommandStatus('Architecture plan canceled. Intake is still saved, and you can restart when ready.');
  };

  const handleDirectiveSubmit = () => {
    const trimmed = directiveInput.trim();
    if (!trimmed) return;

    if (repairFlow && !repairFlow.approved && /(approve|apply patch|ship patch)/i.test(trimmed)) {
      const approvedRepair = { ...repairFlow, approved: true };
      setRepairFlow(approvedRepair);
      updateMemory({
        fixes: [...projectMemory.fixes, `Approved repair for ${repairFlow.likelyFile}: ${repairFlow.patch}`]
      });
      setBuildLogs((prev) => [...prev, `> repair:${repairFlow.category} :: patch approved for ${repairFlow.likelyFile}`]);
      setCommandStatus(`Patch approved for ${repairFlow.likelyFile}. Retesting QA flow now.`);
      setCmdSuccess(true);
      setDirectiveInput('');
      setTimeout(() => setCmdSuccess(false), 1000);
      return;
    }

    if (/(error|failed|failure|cannot|can't|broken|401|404|500|undefined|exception)/i.test(trimmed)) {
      const repair = getRepairPlan(trimmed, architecturePlan);
      setRepairFlow(repair);
      updateMemory({
        errors: [...projectMemory.errors, `${repair.category}: ${trimmed}`],
        knownIssues: [...projectMemory.knownIssues, `${repair.category}: ${repair.cause}`]
      });
      setCommandStatus(`Repair classified as ${repair.category}. Type APPROVE PATCH to apply the proposed fix for ${repair.likelyFile}.`);
      setBuildLogs((prev) => [
        ...prev,
        `> repair-intake :: ${repair.category} issue detected`,
        `> likely file :: ${repair.likelyFile}`,
        `> cause :: ${repair.cause}`
      ]);
    } else {
      updateMemory({
        decisions: [...projectMemory.decisions, trimmed]
      });
      setCommandStatus('Directive stored in project memory and folded into the next build pass.');
    }

    setCmdSuccess(true);
    setDirectiveInput('');
    setTimeout(() => setCmdSuccess(false), 1000);
  };

  // handleTweak is reserved for the Design tweak panel (coming in next milestone)

  const openFile = (fileName) => {
    if (!openFiles.includes(fileName)) {
      setOpenFiles((prev) => [...prev, fileName]);
    }
    setActiveFile(fileName);
  };

  const closeFile = (fileName, event) => {
    event.stopPropagation();
    const nextFiles = openFiles.filter((file) => file !== fileName);
    setOpenFiles(nextFiles);
    if (activeFile === fileName) {
      setActiveFile(nextFiles[nextFiles.length - 1] || fileNames[0]);
    }
  };

  return (
    <div className="engineer-v2-container">
      <div className="e-cyber-grid"></div>

      <div className="e-hero-panel">
        <div className="e-hero-title">
          <span className="e-hero-label">PROJECT COMMAND CENTER</span>
          <span className="e-hero-name">ZAIRE SOFTWARE FACTORY</span>
          <div className="e-hero-subline">Engineer Mode now runs a full intake, architecture approval, build, QA, repair, and deploy workflow inside the existing launch surface.</div>
        </div>

        <div className="e-hero-stages">
          {[
            { num: 1, label: 'MISSION', icon: <Rocket size={12} /> },
            { num: 2, label: 'ARCHITECTURE', icon: <Server size={12} /> },
            { num: 3, label: 'DESIGN', icon: <Layout size={12} /> },
            { num: 4, label: 'BUILD', icon: <Code2 size={12} /> },
            { num: 5, label: 'DEPLOY', icon: <Globe size={12} /> }
          ].map((stage) => (
            <div
              key={stage.num}
              className={`e-stage-step ${activeStage === stage.num ? 'active' : activeStage > stage.num ? 'completed' : ''}`}
            >
              <div className="e-stage-icon">{activeStage > stage.num ? <CheckCircle2 size={12} /> : stage.icon}</div>
              <span className="e-stage-label">{stage.label}</span>
            </div>
          ))}
        </div>

        <div className="e-mode-toggle">
          <button className={`e-toggle-btn ${skillLevel === 'BEGINNER' ? 'active' : ''}`} onClick={() => handleModeToggle('BEGINNER')}>BEGINNER</button>
          <button className={`e-toggle-btn ${skillLevel === 'PROFESSIONAL' ? 'active' : ''}`} onClick={() => handleModeToggle('PROFESSIONAL')}>PROFESSIONAL</button>
        </div>
      </div>

      <div className="e-command-ribbon">
        {/* <div className="e-ribbon-block e-ribbon-block-primary">
          <div className="e-ribbon-kicker">FLAGSHIP WORKFLOW</div>
          <div className="e-ribbon-title">Engineer Core now behaves like an AI software engineering lane</div>
          <div className="e-ribbon-copy">Structured intake, architecture approval, multi-agent contribution, QA checks, deployment readiness, and repair flow all stay inside the current Engineer Mode shell.</div>
        </div> */}
        <div className="e-ribbon-metrics">
          {commandMetrics.map((metric) => (
            <div key={metric.label} className="e-ribbon-metric">
              <span className="e-ribbon-metric-label">{metric.label}</span>
              <span className="e-ribbon-metric-value">{metric.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="e-workspace-row">
        <div className="e-left-col">
          <div className="e-stack-panel">
            <div className="e-panel-header"><Layers size={10} style={{ color: 'var(--e-primary)' }} /> SYSTEM ARCHITECT</div>
            <div className="e-signal-strip">
              {workspaceSignals.map((signal) => (
                <div key={signal.label} className="e-signal-chip">
                  <span className="e-signal-chip-label">{signal.label}</span>
                  <span className="e-signal-chip-value">{signal.value}</span>
                </div>
              ))}
            </div>
            <div className="e-stack-list">
              {architecturePlan.techStack.map((stackItem, index) => (
                <div key={stackItem} className={`e-stack-item ${activeStage >= 2 ? 'e-fade-in' : 'opacity-50'}`} style={{ animationDelay: `${index * 0.05}s` }}>
                  <div className="e-si-left">
                    <span className="e-si-role">STACK</span>
                    <span className="e-si-tech">{stackItem}</span>
                  </div>
                  <div className="e-si-icon">{index % 2 === 0 ? <Server size={12} /> : <FileCode2 size={12} />}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="e-map-panel">
            <div className="e-panel-header"><Network size={10} className="text-purple-400" /> SYSTEM TOPOLOGY</div>
            <div className="e-map-graph">
              {topologyNodes.map((node, index) => (
                <React.Fragment key={node}>
                  <div className={`e-map-node ${activeStage >= 2 ? 'e-glow-node' : ''}`}>{node}</div>
                  {index < topologyNodes.length - 1 && <div className={`e-map-line ${activeStage >= 2 ? 'e-line-active' : ''}`} style={{ top: `${30 + index * 45}px` }}></div>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="e-center-col">
          <div className="e-workspace-area">
            {activeStage === 1 && (
              <div className="e-dynamic-view e-fade-in e-stage-one-view">
                <div className="e-s1-title">What are you building?</div>

                {skillLevel === 'BEGINNER' ? (
                  <div className="e-beginner-intake">
                    <div className="e-s1-grid">
                      {PROJECT_TYPES.map((project) => (
                        <button
                          key={project.id}
                          className="e-s1-card relative overflow-hidden group"
                          onClick={() => handleIntakeChange('projectType', project.id)}
                          disabled={isProcessing}
                        >
                          <div className="e-s1-icon group-hover:scale-110 transition-transform">{project.icon}</div>
                          <span className="e-s1-name">{project.name.toUpperCase()}</span>
                          {intakeAnswers.projectType === project.id && <span className="e-selection-pill">SELECTED</span>}
                        </button>
                      ))}
                    </div>

                    <div className="e-pro-matrix e-fade-in">
                      <div className="e-pro-matrix-header">
                        <div className="e-pro-matrix-title">GUIDED ENGINEER INTAKE</div>
                        <div className="e-pro-matrix-subtitle flex items-center gap-2"><Activity size={10} className="animate-pulse" /> FRIENDLY MODE: STEP-BY-STEP</div>
                      </div>
                      <div className="e-beginner-grid">
                        <div className="e-pro-field"><label htmlFor="beginner-project-name">Project Name</label><input {...getFieldProps('beginner', 'project-name')} type="text" value={intakeAnswers.projectName} onChange={(event) => handleIntakeChange('projectName', event.target.value)} /></div>
                        <div className="e-pro-field"><label htmlFor="beginner-who">Who is it for?</label><input {...getFieldProps('beginner', 'who')} type="text" value={intakeAnswers.who} onChange={(event) => handleIntakeChange('who', event.target.value)} /></div>
                        <div className="e-pro-field e-span-2"><label htmlFor="beginner-what">What are you building?</label><textarea {...getFieldProps('beginner', 'what')} value={intakeAnswers.what} onChange={(event) => handleIntakeChange('what', event.target.value)} /></div>
                        <div className="e-pro-field"><label htmlFor="beginner-scope">Frontend only or full-stack?</label><select {...getFieldProps('beginner', 'scope')} value={intakeAnswers.scope} onChange={(event) => handleIntakeChange('scope', event.target.value)}><option value="frontend">Frontend Only</option><option value="full-stack">Full-Stack</option></select></div>
                        <div className="e-pro-field"><label htmlFor="beginner-auth">Need auth?</label><select {...getFieldProps('beginner', 'auth')} value={intakeAnswers.auth} onChange={(event) => handleIntakeChange('auth', event.target.value)}><option value="yes">Yes</option><option value="no">No</option></select></div>
                        <div className="e-pro-field"><label htmlFor="beginner-database">Need database?</label><select {...getFieldProps('beginner', 'database')} value={intakeAnswers.database} onChange={(event) => handleIntakeChange('database', event.target.value)}><option value="yes">Yes</option><option value="no">No</option></select></div>
                        <div className="e-pro-field"><label htmlFor="beginner-payments">Need payments?</label><select {...getFieldProps('beginner', 'payments')} value={intakeAnswers.payments} onChange={(event) => handleIntakeChange('payments', event.target.value)}><option value="yes">Yes</option><option value="no">No</option></select></div>
                        <div className="e-pro-field"><label htmlFor="beginner-design-style">Preferred design style</label><input {...getFieldProps('beginner', 'design-style')} type="text" value={intakeAnswers.designStyle} onChange={(event) => handleIntakeChange('designStyle', event.target.value)} /></div>
                        <div className="e-pro-field"><label htmlFor="beginner-deployment-target">Deployment target</label><select {...getFieldProps('beginner', 'deployment-target')} value={intakeAnswers.deploymentTarget} onChange={(event) => handleIntakeChange('deploymentTarget', event.target.value)}><option>Vercel</option><option>Railway</option><option>Netlify</option></select></div>
                        <div className="e-pro-field e-span-2"><label htmlFor="beginner-reference-sites">Reference websites</label><textarea {...getFieldProps('beginner', 'reference-sites')} value={intakeAnswers.referenceSites} onChange={(event) => handleIntakeChange('referenceSites', event.target.value)} /></div>
                      </div>
                      <button className="e-cmd-btn w-full" onClick={handleGenerateArchitecture} disabled={isProcessing}>
                        {isProcessing ? <><Loader2 size={12} className="animate-spin mr-2" /> {loadingText}</> : 'GENERATE ARCHITECTURE PLAN'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="e-pro-matrix e-fade-in">
                    <div className="e-pro-matrix-header">
                      <div className="e-pro-matrix-title">INITIALIZATION MATRIX</div>
                      <div className="e-pro-matrix-subtitle flex items-center gap-2"><Activity size={10} className="animate-pulse" /> INTAKE: STRUCTURED + PERSISTENT</div>
                    </div>
                    <div className="e-pro-setup-grid">
                      <div className="e-pro-box">
                        <div className="e-pro-heading"><Settings size={10} /> MISSION</div>
                        <div className="e-pro-field"><label htmlFor="pro-project-name">Project Name</label><input {...getFieldProps('pro', 'project-name')} type="text" value={intakeAnswers.projectName} onChange={(event) => handleIntakeChange('projectName', event.target.value)} /></div>
                        <div className="e-pro-field"><label htmlFor="pro-what">What are you building?</label><textarea {...getFieldProps('pro', 'what')} value={intakeAnswers.what} onChange={(event) => handleIntakeChange('what', event.target.value)} /></div>
                        <div className="e-pro-field"><label htmlFor="pro-who">Who is it for?</label><input {...getFieldProps('pro', 'who')} type="text" value={intakeAnswers.who} onChange={(event) => handleIntakeChange('who', event.target.value)} /></div>
                        <div className="e-pro-field"><label htmlFor="pro-project-type">Project Type</label><select {...getFieldProps('pro', 'project-type')} value={intakeAnswers.projectType} onChange={(event) => handleIntakeChange('projectType', event.target.value)}>{PROJECT_TYPES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
                      </div>
                      <div className="e-pro-box">
                        <div className="e-pro-heading"><Cpu size={10} /> SYSTEMS</div>
                        <div className="e-pro-field"><label htmlFor="pro-scope">Frontend only or full-stack?</label><select {...getFieldProps('pro', 'scope')} value={intakeAnswers.scope} onChange={(event) => handleIntakeChange('scope', event.target.value)}><option value="frontend">Frontend Only</option><option value="full-stack">Full-Stack</option></select></div>
                        <div className="e-pro-field"><label htmlFor="pro-auth">Need auth?</label><select {...getFieldProps('pro', 'auth')} value={intakeAnswers.auth} onChange={(event) => handleIntakeChange('auth', event.target.value)}><option value="yes">Yes</option><option value="no">No</option></select></div>
                        <div className="e-pro-field"><label htmlFor="pro-database">Need database?</label><select {...getFieldProps('pro', 'database')} value={intakeAnswers.database} onChange={(event) => handleIntakeChange('database', event.target.value)}><option value="yes">Yes</option><option value="no">No</option></select></div>
                        <div className="e-pro-field"><label htmlFor="pro-payments">Need payments?</label><select {...getFieldProps('pro', 'payments')} value={intakeAnswers.payments} onChange={(event) => handleIntakeChange('payments', event.target.value)}><option value="yes">Yes</option><option value="no">No</option></select></div>
                      </div>
                      <div className="e-pro-box">
                        <div className="e-pro-heading"><Box size={10} /> LAUNCH PARAMETERS</div>
                        <div className="e-pro-field"><label htmlFor="pro-design-style">Preferred design style</label><input {...getFieldProps('pro', 'design-style')} type="text" value={intakeAnswers.designStyle} onChange={(event) => handleIntakeChange('designStyle', event.target.value)} /></div>
                        <div className="e-pro-field"><label htmlFor="pro-deployment-target">Deployment target</label><select {...getFieldProps('pro', 'deployment-target')} value={intakeAnswers.deploymentTarget} onChange={(event) => handleIntakeChange('deploymentTarget', event.target.value)}><option>Vercel</option><option>Railway</option><option>Netlify</option></select></div>
                        <div className="e-pro-field"><label htmlFor="pro-reference-sites">Any reference websites?</label><textarea {...getFieldProps('pro', 'reference-sites')} value={intakeAnswers.referenceSites} onChange={(event) => handleIntakeChange('referenceSites', event.target.value)} /></div>
                        <div className="e-pro-field"><label htmlFor="pro-mode-preference">Beginner mode or pro mode?</label><select {...getFieldProps('pro', 'mode-preference')} value={intakeAnswers.modePreference} onChange={(event) => handleIntakeChange('modePreference', event.target.value)}><option value="beginner">Beginner</option><option value="pro">Pro</option></select></div>
                      </div>
                    </div>
                    <button className="e-cmd-btn w-full" onClick={handleGenerateArchitecture} disabled={isProcessing}>
                      {isProcessing ? <><Loader2 size={12} className="animate-spin mr-2" /> {loadingText}</> : 'GENERATE ARCHITECTURE PLAN'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeStage === 2 && (
              <div className="e-dynamic-view e-fade-in e-stage-top-view">
                <div className="e-pro-arch-matrix e-fade-in">
                    <div className="e-pro-matrix-header mb-2">
                      <div className="e-pro-matrix-title">ARCHITECTURE PLAN</div>
                      <div className="e-approval-gate">
                        <button className="e-cmd-btn" style={{ minWidth: 'auto', padding: '0 12px', height: '24px' }} onClick={handleApproveArchitecture} disabled={isProcessing}>
                          {isProcessing ? <Loader2 size={10} className="animate-spin" /> : 'APPROVE ARCHITECTURE'}
                        </button>
                        <button type="button" className="e-ghost-btn" onClick={handleEditPlan} disabled={isProcessing}>EDIT PLAN</button>
                        <button type="button" className="e-ghost-btn" onClick={handleCancelPlan} disabled={isProcessing}>CANCEL</button>
                      </div>
                    </div>
                  {skillLevel === 'BEGINNER' && (
                    <div className="e-stage-help">
                      ZAIRE is showing the blueprint before any code is generated. This step helps you confirm what will be built, what tools will be used, and what setup is required before moving forward.
                    </div>
                  )}
                  <div className="e-arch-layer">
                    <div className="e-arch-layer-header"><span>Mission & Assumptions</span> <Activity size={12} /></div>
                    <div className="e-architecture-list">
                      <div className="p-3 mb-2 rounded border border-orange-500/30 bg-orange-500/5">
                        <span className="e-architecture-key text-orange-400 font-semibold mb-1 block flex items-center gap-2"><AlertTriangle size={12} /> RAW USER INTENT</span>
                        <span className="e-architecture-value italic text-zinc-300">"{architecturePlan.summary}"</span>
                      </div>
                      <div><span className="e-architecture-key">Assumptions</span><span className="e-architecture-value">{architecturePlan.assumptions.join(' • ')}</span></div>
                    </div>
                  </div>
                  <div className="e-arch-layer">
                    <div className="e-arch-layer-header"><span>Agent Consensus</span> <Cpu size={12} /></div>
                    <div className="e-architecture-list">
                      {agentContributions.slice(0, 4).map((item) => (
                        <div key={item.agent}><span className="e-architecture-key">{item.agent}</span><span className="e-architecture-value">{item.summary}</span></div>
                      ))}
                    </div>
                  </div>
                  <div className="e-arch-layer">
                    <div className="e-arch-layer-header"><span>Project Shape</span> <Globe size={12} /></div>
                    <div className="e-arch-layer-grid">
                      <div className="e-arch-node"><Activity size={14} className="e-arch-node-icon" /><div className="e-arch-node-text"><span className="e-arch-node-title">{architecturePlan.projectTypeLabel}</span><span className="e-arch-node-sub">{architecturePlan.isFullStack ? 'Full-stack workflow' : 'Frontend workflow'}</span></div></div>
                      <div className="e-arch-node"><Layout size={14} className="e-arch-node-icon" /><div className="e-arch-node-text"><span className="e-arch-node-title">{architecturePlan.pages.length} Pages</span><span className="e-arch-node-sub">{architecturePlan.pages.slice(0, 2).join(' / ')}</span></div></div>
                      <div className="e-arch-node"><Box size={14} className="e-arch-node-icon" /><div className="e-arch-node-text"><span className="e-arch-node-title">{architecturePlan.components.length} Components</span><span className="e-arch-node-sub">{architecturePlan.components.slice(0, 2).join(' / ')}</span></div></div>
                    </div>
                  </div>
                  <div className="e-arch-layer">
                    <div className="e-arch-layer-header"><span>Tech Stack + Routes</span> <Server size={12} /></div>
                    <div className="e-architecture-list">
                      <div><span className="e-architecture-key">Tech Stack</span><span className="e-architecture-value">{architecturePlan.techStack.join(' • ')}</span></div>
                      <div><span className="e-architecture-key">API Routes</span><span className="e-architecture-value">{architecturePlan.apiRoutes.join(' • ')}</span></div>
                      <div><span className="e-architecture-key">Auth Flow</span><span className="e-architecture-value">{architecturePlan.authFlow}</span></div>
                      <div><span className="e-architecture-key">Payment Flow</span><span className="e-architecture-value">{architecturePlan.paymentFlow}</span></div>
                    </div>
                  </div>
                  <div className="e-arch-layer">
                    <div className="e-arch-layer-header"><span>Data, Risk, Deployment</span> <HardDrive size={12} /></div>
                    <div className="e-architecture-list">
                      <div><span className="e-architecture-key">Database Schema</span><span className="e-architecture-value">{architecturePlan.databaseSchema.join(' • ')}</span></div>
                      <div><span className="e-architecture-key">Deployment Plan</span><span className="e-architecture-value">{architecturePlan.deploymentPlan.join(' • ')}</span></div>
                      <div><span className="e-architecture-key">Risks</span><span className="e-architecture-value">{architecturePlan.risks.join(' • ')}</span></div>
                      <div><span className="e-architecture-key">Required Env</span><span className="e-architecture-value">{architecturePlan.requiredEnvVariables.join(' • ')}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStage === 3 && (
              <div className="e-dynamic-view e-fade-in e-stage-top-view">
                <div className="e-pro-arch-matrix e-fade-in">
                  <div className="e-pro-matrix-header mb-2">
                    <div className="e-pro-matrix-title">DESIGN INTELLIGENCE BRIEF</div>
                    <div className="e-approval-gate">
                      <button className="e-cmd-btn" style={{ minWidth: 'auto', padding: '0 12px', height: '24px' }} onClick={handleApproveDesign} disabled={isProcessing}>
                        {isProcessing ? <Loader2 size={10} className="animate-spin" /> : 'APPROVE & SCAFFOLD'}
                      </button>
                      <button type="button" className="e-ghost-btn" onClick={handleRegenerateDesign} disabled={isProcessing}>REGENERATE</button>
                      <button type="button" className="e-ghost-btn" onClick={() => { setActiveStage(2); setBuildSubPhase('ARCHITECT'); setDesignBrief(null); }} disabled={isProcessing}>BACK</button>
                    </div>
                  </div>
                  
                  <div className="e-arch-layer">
                    <div className="e-arch-layer-header"><span>Summary + Assumptions</span> <Activity size={12} /></div>
                    <div className="e-architecture-list">
                      <div>
                        <span className="e-architecture-key">Summary</span>
                        <span className="e-architecture-value">{designBrief?.competitive_analysis?.category || 'Dark industrial command-center aesthetic with a single warm accent.'}</span>
                      </div>
                      <div>
                        <span className="e-architecture-key">Assumptions</span>
                        <span className="e-architecture-value">Cyan is reserved for the ZAIRE shell — this project gets its own one-accent identity so it doesn't read as "another ZAIRE screen."</span>
                      </div>
                    </div>
                  </div>

                  <div className="e-arch-layer">
                    <div className="e-arch-layer-header"><span>Resolved Tokens</span> <Layout size={12} /></div>
                    <div className="e-architecture-list">
                      <div>
                        <span className="e-architecture-key">Primary accent</span>
                        <span className="e-architecture-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: designBrief?.visual_tokens?.primary_color || '#FF6A00' }}></span>
                          {designBrief?.visual_tokens?.primary_color || '#FF6A00'} → used only on CTA + active states
                        </span>
                      </div>
                      <div><span className="e-architecture-key">Neutral scale</span><span className="e-architecture-value">{designBrief?.visual_tokens?.neutral_scale || '#05080A → #F5F6F7 (9 steps)'}</span></div>
                      <div><span className="e-architecture-key">Display font</span><span className="e-architecture-value">{designBrief?.visual_tokens?.typography?.display || 'Space Grotesk (headings)'}</span></div>
                      <div><span className="e-architecture-key">Body font</span><span className="e-architecture-value">{designBrief?.visual_tokens?.typography?.body || 'Inter (body/UI text)'}</span></div>
                      <div><span className="e-architecture-key">Type scale</span><span className="e-architecture-value">1.25 ratio, base 16px</span></div>
                      <div><span className="e-architecture-key">Radius system</span><span className="e-architecture-value">{designBrief?.visual_tokens?.border_radius || '4px (sharp/industrial — matches "command center" direction)'}</span></div>
                      <div><span className="e-architecture-key">Spacing grid</span><span className="e-architecture-value">{designBrief?.visual_tokens?.spacing_system || '8px base'}</span></div>
                    </div>
                  </div>

                  <div className="e-arch-layer">
                    <div className="e-arch-layer-header"><span>Competitive Analysis</span> <Search size={12} /></div>
                    <div className="e-architecture-list">
                      <div><span className="e-architecture-key">Category</span><span className="e-architecture-value">{designBrief?.competitive_analysis?.category || 'developer/founder portfolio'}</span></div>
                      <div><span className="e-architecture-key">References Analyzed</span><span className="e-architecture-value">category defaults (none provided in intake)</span></div>
                      <div><span className="e-architecture-key">Table Stakes</span><span className="e-architecture-value">{designBrief?.competitive_analysis?.table_stakes?.join(', ') || 'one clear "what I build" statement above the fold, visible project list with real outcomes (not just names), one direct contact path'}</span></div>
                      <div><span className="e-architecture-key">Differentiate</span><span className="e-architecture-value">{designBrief?.competitive_analysis?.differentiation_opportunities?.join(', ') || 'most dev portfolios lead with a bio — lead with proof (a real shipped project) instead'}</span></div>
                      <div><span className="e-architecture-key">Avoid</span><span className="e-architecture-value">{designBrief?.competitive_analysis?.avoid?.join(', ') || 'generic "Hi, I\'m a passionate developer" opening line, skill-badge walls with no context of what was built'}</span></div>
                    </div>
                  </div>

                  <div className="e-arch-layer">
                    <div className="e-arch-layer-header"><span>Agent Consensus</span> <Cpu size={12} /></div>
                    <div className="e-architecture-list">
                      <div><span className="e-architecture-key">Design Agent</span><span className="e-architecture-value">Resolved industrial-orange single-accent system, 4px radius, Space Grotesk / Inter pairing.</span></div>
                      <div><span className="e-architecture-key">Content Agent</span><span className="e-architecture-value">Rejected literal reuse of intake text as page copy. Drafted outcome-led headline instead of a product description.</span></div>
                      <div><span className="e-architecture-key">Competitive Agent</span><span className="e-architecture-value">Portfolio category — proof-first structure prioritized over bio-first.</span></div>
                    </div>
                  </div>

                  <div className="e-arch-layer">
                    <div className="e-arch-layer-header"><span>Project Shape</span> <Globe size={12} /></div>
                    <div className="e-arch-layer-grid">
                      <div className="e-arch-node"><Activity size={14} className="e-arch-node-icon" /><div className="e-arch-node-text"><span className="e-arch-node-title">1 accent color</span><span className="e-arch-node-sub">{designBrief?.visual_tokens?.primary_color || '#FF6A00'}</span></div></div>
                      <div className="e-arch-node"><Layout size={14} className="e-arch-node-icon" /><div className="e-arch-node-text"><span className="e-arch-node-title">2 fonts</span><span className="e-arch-node-sub">Display & Body</span></div></div>
                      <div className="e-arch-node"><Box size={14} className="e-arch-node-icon" /><div className="e-arch-node-text"><span className="e-arch-node-title">{designBrief?.visual_tokens?.border_radius || '4px radius'}</span><span className="e-arch-node-sub">Sharp edges</span></div></div>
                      <div className="e-arch-node"><Zap size={14} className="e-arch-node-icon" /><div className="e-arch-node-text"><span className="e-arch-node-title">{designBrief?.motion_spec?.level || 'Moderate motion'}</span><span className="e-arch-node-sub">Micro-interactions</span></div></div>
                    </div>
                  </div>

                </div>
              </div>
            )}
            {activeStage === 4 && (
              <div className="e-code-view e-fade-in">
                {skillLevel === 'PROFESSIONAL' && (
                  <>
                    <div className="e-code-activity-bar">
                      <div className="e-code-activity-icon active"><FileCode2 size={16} /></div>
                      <div className="e-code-activity-icon"><Search size={16} /></div>
                      <div className="e-code-activity-icon"><GitBranch size={16} /><div className="e-activity-badge">{qaReport.warnings}</div></div>
                      <div className="e-code-activity-icon"><MonitorPlay size={16} /></div>
                      <Settings size={16} className="e-code-activity-icon mt-auto mb-4 hover:rotate-90 transition-transform" />
                    </div>
                    <div className="e-code-sidebar">
                      <div className="e-code-sb-header">EXPLORER <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-[var(--e-primary)]"></span></div>
                      <div className="e-file-tree">
                        <div className="e-file-item text-gray-500">src / app</div>
                        {fileNames.map((file) => (
                          <div key={file} className={`e-file-item ${activeFile === file ? 'active' : ''}`} onClick={() => openFile(file)}>
                            <FileCode2 size={10} className={activeFile === file ? 'text-[var(--e-primary)]' : ''} /> {file}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="e-code-main">
                  <div className="e-code-header flex justify-between items-center pr-3">
                    <div className="flex">
                      {openFiles.map((file) => (
                        <span key={file} className={`e-code-tab ${activeFile === file ? 'active' : ''}`} onClick={() => setActiveFile(file)}>
                          <FileCode2 size={10} className={activeFile === file ? 'text-[var(--e-primary)]' : ''} /> {file}
                          <span className="e-code-tab-close hover:text-white" onClick={(event) => closeFile(file, event)}>x</span>
                        </span>
                      ))}
                    </div>
                    <button className="e-cmd-btn" onClick={() => advanceStage(5, 'Preparing deployment readiness report...', 'DEPLOY')} disabled={isProcessing || qaReport.errors > 0}>
                      {isProcessing ? <Loader2 size={10} className="animate-spin" /> : 'PACKAGE -> DEPLOY'}
                    </button>
                  </div>
                  <div className="e-phase-rail">
                    {phaseTimeline.map((item) => (
                      <div key={item.phase} className={`e-phase-pill ${item.active ? 'active' : ''} ${item.completed ? 'completed' : ''}`}>
                        {item.phase}
                      </div>
                    ))}
                  </div>
                  {skillLevel === 'BEGINNER' && <div className="e-stage-help e-stage-help-build">{getBeginnerPhaseExplanation(currentPhase)}</div>}
                  <div className="e-code-content">{activeFileArtifact?.content}</div>
                  <div className="e-file-explainer">
                    <div className="e-file-explainer-grid">
                      <div className="e-file-explainer-card"><span className="e-file-explainer-label">What it does</span><span>{activeFileExplanation?.what}</span></div>
                      <div className="e-file-explainer-card"><span className="e-file-explainer-label">Why it exists</span><span>{activeFileExplanation?.why}</span></div>
                      <div className="e-file-explainer-card"><span className="e-file-explainer-label">What you can edit</span><span>{activeFileExplanation?.edit}</span></div>
                      <div className="e-file-explainer-card"><span className="e-file-explainer-label">What not to touch</span><span>{activeFileExplanation?.protect}</span></div>
                    </div>
                  </div>

                  <div className="e-terminal-pane">
                    <div className="e-term-header">
                      <span className="e-term-tab active">TERMINAL</span>
                      <span className="e-term-tab">QA</span>
                      <span className="e-term-tab">PROBLEMS <span style={{ color: '#8b949e', background: 'rgba(255,255,255,0.05)', padding: '2px 4px', borderRadius: '4px', fontSize: '8px', marginLeft: '4px' }}>{qaReport.errors}</span></span>
                    </div>
                    <div className="e-term-body font-mono">
                      <div className="e-qa-summary">
                        <span>PASSED {qaReport.passed}</span>
                        <span>WARNINGS {qaReport.warnings}</span>
                        <span>ERRORS {qaReport.errors}</span>
                        <span>PHASE {currentPhase}</span>
                      </div>
                      {agentContributions.map((item) => (
                        <div key={item.agent} className="e-term-line e-term-agent">[{item.agent}] {item.summary}</div>
                      ))}
                      {mapWithStableKeys(
                        buildLogs,
                        (log) => log,
                        (log, stableKey) => (
                          <div key={stableKey} className={`e-term-line ${log.includes('phase:test') ? 'e-term-info' : log.includes('repair') ? 'e-term-warn' : ''}`}>{log}</div>
                        )
                      )}
                      {qaReport.checks.map((check) => (
                        <div key={check.label} className={`e-term-line ${check.status === 'PASSED' ? 'e-term-info' : check.status === 'WARNING' ? 'e-term-warn' : 'e-term-err'}`}>
                          [{check.status}] {check.label}: {check.detail}
                        </div>
                      ))}
                      {repairFlow && !repairFlow.approved && (
                        <>
                          <div className="e-term-line e-term-warn">[REPAIR] category: {repairFlow.category}</div>
                          <div className="e-term-line e-term-warn">[REPAIR] likely file: {repairFlow.likelyFile}</div>
                          <div className="e-term-line e-term-warn">[REPAIR] cause: {repairFlow.cause}</div>
                          <div className="e-term-line e-term-warn">[REPAIR] proposed patch: {repairFlow.patch}</div>
                          <div className="e-term-line">Type APPROVE PATCH in the command bar to apply and retest.</div>
                        </>
                      )}
                      <div className="e-term-line mt-1"><span className="e-term-prompt">zaire@system:~$</span> <span className="animate-pulse">_</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStage === 5 && (
              <div className="e-dynamic-view e-fade-in e-stage-top-view">
                <div className="e-pro-deploy-dash e-fade-in">
                  <div className="e-deploy-hero">
                    <div className="e-dh-left">
                      <div className="e-dh-icon"><Zap size={20} className={deployReport.readyStatus === 'READY' ? 'text-green-400' : 'animate-pulse'} /></div>
                      <div className="e-dh-text">
                        <h2>{deployReport.readyStatus === 'READY' ? 'DEPLOYMENT_READY' : 'DEPLOYMENT_BLOCKED'}</h2>
                        <button type="button" className="e-inline-link">{deployReport.hostingTarget} launch target <ExternalLink size={10} /></button>
                      </div>
                    </div>
                    <div className="e-dh-right">
                      <button className="e-ghost-btn mr-2" onClick={handleDownloadZip} disabled={isProcessing}>
                        {isProcessing ? <Loader2 size={10} className="animate-spin" /> : 'DOWNLOAD ZIP'}
                      </button>
                      <button className="e-cmd-btn">MANAGE INFRASTRUCTURE</button>
                    </div>
                  </div>

                  <div className="e-deploy-metrics-grid">
                    <div className="e-d-metric-box"><label>Hosting Target</label><span>{deployReport.hostingTarget}</span></div>
                    <div className="e-d-metric-box"><label>Database Required</label><span>{deployReport.databaseRequired}</span></div>
                    <div className="e-d-metric-box"><label>Auth Required</label><span>{deployReport.authRequired}</span></div>
                    <div className="e-d-metric-box"><label>Ready Status</label><span className={deployReport.readyStatus === 'READY' ? 'text-green-400' : 'text-yellow-400'}>{deployReport.readyStatus}</span></div>
                  </div>

                  <div className="e-deploy-logs-box">
                    <div className="e-dl-header flex justify-between"><span>DEPLOYMENT READINESS REPORT</span>{deployLogs.length < 7 && <Loader2 size={10} className="animate-spin text-[var(--e-primary)]" />}</div>
                    <div className="e-dl-body">
                      {mapWithStableKeys(
                        deployLogs,
                        (log) => log,
                        (log, stableKey) => (
                          <div key={stableKey} className={log.includes('COMPLETE') ? 'mt-2 text-white font-bold' : ''}>{log}</div>
                        )
                      )}
                      <div className="e-report-divider"></div>
                      <div>Phase history: {projectMemory.phaseHistory.join(' -> ')}</div>
                      <div>Generated files: {projectMemory.generatedFiles.join(', ')}</div>
                      <div>Required env vars: {deployReport.requiredEnvVariables.join(', ')}</div>
                      <div>Payments required: {deployReport.paymentRequired}</div>
                      {projectMemory.knownIssues.length > 0 && <div>Known issues: {projectMemory.knownIssues.join(' • ')}</div>}
                      {deployReport.nextSteps.map((step) => (
                        <div key={step}>Next step: {step}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="e-command-bar relative">
            <div className="e-cmd-status">{commandStatus}</div>
            <input
              id="engineer-command-bar"
              name="engineer-command-bar"
              type="text"
              className={`e-cmd-input transition-colors ${cmdSuccess ? 'bg-[rgba(249,115,22,0.1)] border border-[var(--e-primary)]' : ''}`}
              placeholder={repairFlow && !repairFlow.approved ? 'Type APPROVE PATCH to apply the suggested fix...' : 'Enter mission directives, changes, or paste an error for repair...'}
              value={directiveInput}
              onChange={(event) => setDirectiveInput(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleDirectiveSubmit()}
              disabled={cmdSuccess}
            />
            <button className="e-cmd-btn group" onClick={handleDirectiveSubmit} disabled={cmdSuccess}>
              {cmdSuccess ? <CheckCircle2 size={12} className="text-green-400" /> : <Play size={12} className="group-hover:scale-110 transition-transform" />}
            </button>
          </div>
        </div>

        <div className="e-right-col">
          <div className="e-team-panel">
            <div className="e-panel-header"><Box size={10} className="text-yellow-400" /> AI TEAM STATUS</div>
            <div className="e-team-list">
              {aiTeam.map((agent) => (
                <div key={agent.name} className="e-agent-row group">
                  <div className={`e-agent-avatar transition-colors ${agent.active ? 'bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.3)]' : ''}`}>
                    {agent.active ? <Activity size={12} style={{ color: 'var(--e-primary)' }} className="animate-pulse" /> : agent.status === 'Complete' || agent.status === 'Passed' || agent.status === 'READY' || agent.status === 'Not Needed' ? <CheckCircle2 size={12} className="text-green-400" /> : <TerminalSquare size={12} className="text-gray-500" />}
                  </div>
                  <div className="e-agent-info w-full">
                    <div className="flex justify-between items-center w-full">
                      <span className="e-agent-name group-hover:text-[var(--e-primary)] transition-colors">{agent.name}</span>
                      <span className={`e-agent-status ${agent.active ? 'text-[var(--e-primary)] font-bold' : agent.status === 'Waiting' ? 'text-gray-500' : 'text-green-400'}`}>{agent.status}</span>
                    </div>
                    <div className="e-agent-note">{agent.note}</div>
                    <div className="e-agent-memory"><div className="e-agent-mem-fill" style={{ width: agent.mem }}></div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="e-audit-panel">
            <div className="e-panel-header flex justify-between items-center">
              <span className="flex items-center gap-2"><ShieldCheck size={10} className="text-emerald-400" /> WORKFLOW AUDITOR</span>
              {activeStage >= 4 && <Loader2 size={8} className="animate-spin text-emerald-400" />}
            </div>
            <div className="e-audit-grid">
              <div className={`e-audit-score ${activeStage >= 2 ? 'e-pulse-bg' : ''}`}><span className="e-audit-val">{architecturePlan.pages.length}</span><span className="e-audit-label">Pages</span><div className="e-audit-pro-stat"><span>Routes</span><span className="e-audit-pro-val">{architecturePlan.apiRoutes.length}</span></div><div className="e-audit-pro-stat"><span>Env Vars</span><span className="e-audit-pro-val">{architecturePlan.requiredEnvVariables.length}</span></div></div>
              <div className={`e-audit-score ${activeStage >= 2 ? 'e-pulse-bg' : ''}`} style={{ animationDelay: '0.1s' }}><span className="e-audit-val">{architecturePlan.components.length}</span><span className="e-audit-label">Components</span><div className="e-audit-pro-stat"><span>Auth</span><span className="e-audit-pro-val">{deployReport.authRequired}</span></div><div className="e-audit-pro-stat"><span>DB</span><span className="e-audit-pro-val">{deployReport.databaseRequired}</span></div></div>
              <div className={`e-audit-score ${activeStage >= 4 ? 'e-pulse-bg' : ''}`} style={{ animationDelay: '0.2s' }}><span className="e-audit-val text-yellow-400">{qaReport.warnings}</span><span className="e-audit-label">Warnings</span><div className="e-audit-pro-stat"><span>Passed</span><span className="e-audit-pro-val">{qaReport.passed}</span></div><div className="e-audit-pro-stat"><span>Errors</span><span className="e-audit-pro-val text-yellow-400">{qaReport.errors}</span></div></div>
              <div className={`e-audit-score ${activeStage >= 5 ? 'e-pulse-bg' : ''}`} style={{ animationDelay: '0.3s' }}><span className="e-audit-val text-yellow-400">{projectMemory.phaseHistory.length}</span><span className="e-audit-label">Workflow Memory</span><div className="e-audit-pro-stat"><span>Signals</span><span className="e-audit-pro-val">{projectMemory.agentNotes.length}</span></div><div className="e-audit-pro-stat"><span>Target</span><span className="e-audit-pro-val">{deployReport.hostingTarget}</span></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngineerModeV2;
