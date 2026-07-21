import os

file_path = 'src/components/modes/EngineerModeV2.js'

with open(file_path, 'r', encoding='utf-8') as f:
    c = f.read()

# Fix backendStatus display
c = c.replace(
    "{ label: 'Backend', value: backendStatus === 'connected' ? 'Connected' : backendStatus === 'offline' ? 'Offline fallback' : 'Checking' }",
    "{ label: 'Backend', value: backendStatus === 'connected' ? (specialistData?.forge_telemetry?.status === 'CLOUD_RUNTIME' ? 'CLOUD RUNTIME' : 'LOCAL RUNTIME') : 'OFFLINE' }"
)

# Fix materialize auto-advance
c = c.replace(
    "setCommandStatus(`Website generated at ${result.outputDir}`);\n      updateMemory({",
    "setCommandStatus(`Website generated at ${result.outputDir}`);\n      setTimeout(() => setActiveStage(5), 2000);\n      updateMemory({"
)

# Add handleDownloadZip
download_zip_fn = """
  const handleDownloadZip = async () => {
    try {
      const response = await fetch('/engineer/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName: architecturePlan.normalizedName })
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${architecturePlan.normalizedName}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to export ZIP');
      }
    } catch (e) {
      console.error('Download failed', e);
      alert('Download failed: ' + e.message);
    }
  };

  const handleStartRealBuild = async () => {"""
c = c.replace("  const handleStartRealBuild = async () => {", download_zip_fn)

# Add button
button_html = """                      <div className="e-dh-right">
                        <button className="e-cmd-btn mr-2" onClick={handleDownloadZip}>DOWNLOAD ZIP</button>
                        <button className="e-cmd-btn">MANAGE INFRASTRUCTURE</button>
                      </div>"""
c = c.replace('<div className="e-dh-right"><button className="e-cmd-btn">MANAGE INFRASTRUCTURE</button></div>', button_html)

# Add error toasts for plan, scaffold, materialize.
c = c.replace("setCommandStatus(`Architecture generation failed: ${err.message}`);", "setCommandStatus(`Architecture generation failed: ${err.message}`);\n      alert(`Architecture generation failed: ${err.message}`);")
c = c.replace("setCommandStatus(`Scaffold failed: ${err.message}`);", "setCommandStatus(`Scaffold failed: ${err.message}`);\n      alert(`Scaffold failed: ${err.message}`);")
c = c.replace("setCommandStatus(`Build failed before writing files: ${err.message}`);", "setCommandStatus(`Build failed before writing files: ${err.message}`);\n      alert(`Build failed: ${err.message}`);")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(c)

print("Frontend fixes applied")
