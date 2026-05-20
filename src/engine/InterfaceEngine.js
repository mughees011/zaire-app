/**
 * ZAIRE Interface Engine
 * This defines the Mode DNA (Configuration > Page).
 * The Layout Engine consumes these to paint the UI.
 */

// ZAIRE Default Mode DNA Profiles
export const ZaireInterfaceDNA = {
  // ── ENGINEER MODE ──
  engineer: {
    id: "engineer",
    name: "Engineer Mode",
    theme: {
      primaryColor: "#ff4d00", // Stark Orange
      density: "structured", // spacing behavior
      animationProfile: "precision",
      blurStacking: true,
      shadows: "dynamic"
    },
    layout: {
      leftSidebar: ["file_tree", "execution_timeline"],
      main: ["code_editor", "terminal", "live_preview"],
      rightInspector: ["system_logs", "agent_status", "diff_viewer"],
      bottomConsole: ["neural_console"]
    }
  },

  // ── TRADER MODE ──
  trader: {
    id: "trader",
    name: "Trader Mode",
    theme: {
      primaryColor: "#00ff66", // Cyber Green
      density: "dense", // tight packing for maximum data
      animationProfile: "fast-updates",
      blurStacking: false,
      shadows: "harsh"
    },
    layout: {
      leftSidebar: ["whale_scanner", "risk_meter"],
      main: ["candlestick_chart", "portfolio_grid"],
      rightInspector: ["signal_feed", "macro_heatmap"],
      bottomConsole: ["terminal"]
    }
  },

  // ── PROFESSOR MODE ──
  professor: {
    id: "professor",
    name: "Professor Mode",
    theme: {
      primaryColor: "#b200ff", // Academic Purple
      density: "focused", // spacious, readable
      animationProfile: "calm-transitions",
      blurStacking: true,
      shadows: "soft"
    },
    layout: {
      leftSidebar: ["curriculum_graph", "atomic_notes"],
      main: ["lecture_view", "reasoning_map"],
      rightInspector: ["citation_viewer", "flashcard_grid"],
      bottomConsole: ["quiz_generator"]
    }
  },

  // ── DOCTOR MODE (Example Marketplace Profile) ──
  doctor: {
    id: "doctor",
    name: "Medical Diagnostic",
    theme: {
      primaryColor: "#00d4ff", // Medical Cyan
      density: "structured",
      animationProfile: "precision",
      blurStacking: true,
      shadows: "clean"
    },
    layout: {
      leftSidebar: ["vitals_dashboard", "medication_timeline"],
      main: ["patient_notes", "symptom_matrix"],
      rightInspector: ["recovery_tracker", "threat_feed"],
      bottomConsole: ["terminal"]
    }
  }
};

/**
 * Returns the layout configuration for a given mode ID
 */
export const getInterfaceDNA = (modeId) => {
  return ZaireInterfaceDNA[modeId] || ZaireInterfaceDNA.engineer;
};
