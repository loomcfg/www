(function () {
  const root = document.documentElement;
  const savedTheme = localStorage.getItem("loomcfg-theme");
  if (savedTheme === "light" || savedTheme === "dark") {
    root.setAttribute("data-theme", savedTheme);
  }

  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem("loomcfg-theme", next);
    });
  }

  const mobileBtn = document.getElementById("mobileMenuBtn");
  const navLinks = document.getElementById("navLinks");
  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener("click", () => {
      const expanded = mobileBtn.getAttribute("aria-expanded") === "true";
      mobileBtn.setAttribute("aria-expanded", String(!expanded));
      navLinks.classList.toggle("open");
    });
  }

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-tab");
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".code-pane").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const pane = document.getElementById(`pane-${target}`);
      if (pane) pane.classList.add("active");
    });
  });

  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = btn.getAttribute("data-copy");
      if (!text) return;
      await navigator.clipboard.writeText(text);
      const orig = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(() => { btn.textContent = orig; }, 1500);
    });
  });

  const loomInput = document.getElementById("loomInput");
  const jsonOutput = document.getElementById("jsonOutput");
  const parseStatus = document.getElementById("parseStatus");
  const compileTime = document.getElementById("compileTime");
  const presetSelect = document.getElementById("presetSelect");
  const formatBtn = document.getElementById("formatBtn");
  const copyJsonBtn = document.getElementById("copyJsonBtn");

  if (loomInput && jsonOutput) {
    const tq = '"""';
    const presets = {
      service: [
        '# Web service configuration',
        '@schema "./schemas/service.schema.json"',
        '@import "./defaults/http.loom" as http',
        '',
        'service: {',
        '  ...http.server',
        '  name: "billing-gateway"',
        '  port: 8443',
        '  tls_enabled: true',
        '  max_payload_bytes: 52_428_800',
        '  read_timeout: @dur "15s"',
        '  deployed_at: @instant "2026-11-17T21:00:00Z"',
        '}',
        '',
        'routes: [',
        '  { path: "/v1/invoices", rate_limit: 120, auth: "bearer" }',
        '  { path: "/v1/webhooks", rate_limit: 600, auth: "hmac" }',
        ']'
      ].join('\n'),
      telemetry: [
        '# UAV Telemetry Pipeline',
        'app: {',
        '  name: "meala-ingest-worker"',
        '  version: "0.4.2"',
        '  environment: "production"',
        '}',
        '',
        'pipelines: [',
        '  {',
        '    id: "flight-dynamics"',
        '    enabled: true',
        '    tolerance: @dur "20ms"',
        '    forward_fill: ["MODE", "ARMED", "EKF_STATUS"]',
        '  }',
        ']'
      ].join('\n'),
      multiline: [
        '# Dedented multiline SQL + tags',
        'database: {',
        '  host: "db.internal"',
        '  port: 5432',
        '  connect_timeout: @dur "5s"',
        '  retention_date: @date "2027-01-01"',
        '  query: ' + tq,
        '    SELECT timestamp_us, msg_type',
        '    FROM telemetry_frames',
        '    WHERE signal_quality >= 0.85',
        '    ' + tq,
        '}'
      ].join('\n')
    };

    const mockImports = {
      http: {
        server: {
          host: "0.0.0.0",
          keep_alive: true
        }
      }
    };

    function compileLoomPreview(src) {
      const start = performance.now();
      const lines = src.split(/\r?\n/);
      const aliases = {};
      const cleanedLines = [];

      let i = 0;
      while (i < lines.length) {
        let line = lines[i];
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith("#")) {
          i++;
          continue;
        }
        if (trimmed.startsWith("@schema")) {
          i++;
          continue;
        }
        const impMatch = trimmed.match(/^@import\s+"[^"]+"\s+as\s+([A-Za-z_][A-Za-z0-9_-]*)/);
        if (impMatch) {
          aliases[impMatch[1]] = mockImports[impMatch[1]] || { server: { host: "0.0.0.0" } };
          i++;
          continue;
        }

        const blockMatch = line.match(/^(\s*(?:[A-Za-z_][A-Za-z0-9_-]*|"[^"]+")\s*:\s*)"""\s*$/);
        if (blockMatch) {
          const prefix = blockMatch[1];
          const blockLines = [];
          i++;
          let indent = "";
          while (i < lines.length) {
            const closeMatch = lines[i].match(/^(\s*)"""\s*$/);
            if (closeMatch) {
              indent = closeMatch[1];
              break;
            }
            blockLines.push(lines[i]);
            i++;
          }
          const dedented = blockLines
            .map((l) => (l.startsWith(indent) ? l.slice(indent.length) : l.trimStart()))
            .join("\n");
          cleanedLines.push(`${prefix}${JSON.stringify(dedented)}`);
          i++;
          continue;
        }

        let inQuote = false;
        let quoteChar = "";
        let noComment = "";
        for (let c = 0; c < line.length; c++) {
          const ch = line[c];
          if ((ch === '"' || ch === "'") && line[c - 1] !== "\\") {
            if (!inQuote) {
              inQuote = true;
              quoteChar = ch;
            } else if (ch === quoteChar) {
              inQuote = false;
            }
          }
          if (!inQuote && ch === "#") break;
          noComment += ch;
        }

        const spreadMatch = noComment.trim().match(/^\.\.\.([A-Za-z_][A-Za-z0-9_.-]*)$/);
        if (spreadMatch) {
          const parts = spreadMatch[1].split(".");
          let target = aliases[parts[0]];
          for (let p = 1; p < parts.length && target; p++) {
            target = target[parts[p]];
          }
          if (target && typeof target === "object") {
            for (const [k, v] of Object.entries(target)) {
              cleanedLines.push(`${JSON.stringify(k)}: ${JSON.stringify(v)},`);
            }
          }
          i++;
          continue;
        }

        noComment = noComment.replace(/@[a-z][a-z0-9_-]*\s+(?=["'])/g, "");
        noComment = noComment.replace(/^(\s*)([A-Za-z_][A-Za-z0-9_-]*)(\s*:)/, '$1"$2"$3');
        noComment = noComment.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_-]*)(\s*:)/, '$1"$2"$3');
        noComment = noComment.replace(/(\d)_(?=\d)/g, "$1");

        cleanedLines.push(noComment);
        i++;
      }

      const joined = cleanedLines
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l, idx, arr) => {
          if (idx < arr.length - 1) {
            const next = arr[idx + 1];
            const endsValue = !l.endsWith("{") && !l.endsWith("[") && !l.endsWith(",");
            const nextStartsEntry = !next.startsWith("}") && !next.startsWith("]");
            if (endsValue && nextStartsEntry) return l + ",";
          }
          return l;
        })
        .join("\n");

      const parsed = JSON.parse(`{\n${joined}\n}`);
      const elapsed = Math.max(1, Math.round(performance.now() - start));
      return { json: JSON.stringify(parsed, null, 2), elapsed };
    }

    function runCompile() {
      try {
        const res = compileLoomPreview(loomInput.value);
        jsonOutput.textContent = res.json;
        jsonOutput.style.color = "#86efac";
        parseStatus.textContent = "Valid Loom";
        parseStatus.classList.remove("error");
        compileTime.textContent = `${res.elapsed} ms`;
      } catch (err) {
        jsonOutput.textContent = `Syntax Error: ${err.message}`;
        jsonOutput.style.color = "#f87171";
        parseStatus.textContent = "Parse Error";
        parseStatus.classList.add("error");
      }
    }

    loomInput.value = presets.service;
    runCompile();
    loomInput.addEventListener("input", runCompile);

    if (presetSelect) {
      presetSelect.addEventListener("change", () => {
        loomInput.value = presets[presetSelect.value] || presets.service;
        runCompile();
      });
    }

    if (formatBtn) {
      formatBtn.addEventListener("click", () => {
        const formatted = loomInput.value
          .split(/\r?\n/)
          .map((l) => l.replace(/\s+$/, ""))
          .join("\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim() + "\n";
        loomInput.value = formatted;
        runCompile();
      });
    }

    if (copyJsonBtn) {
      copyJsonBtn.addEventListener("click", async () => {
        await navigator.clipboard.writeText(jsonOutput.textContent);
        const orig = copyJsonBtn.textContent;
        copyJsonBtn.textContent = "Copied!";
        setTimeout(() => { copyJsonBtn.textContent = orig; }, 1500);
      });
    }
  }
})();
