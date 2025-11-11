"use client";
import React, { useMemo, useState, useEffect, useDeferredValue } from "react";
import { FixedSizeList as VList, ListChildComponentProps } from "react-window";
import { ChevronDown, ChevronUp } from "lucide-react";

type CodeAvail = "any" | "public" | "private";

type Props = {
  selectedConfs: string[];
  setSelectedConfs: (val: string[]) => void;
  selectedYears: string[];
  setSelectedYears: (val: string[]) => void;
  selectedAuthors: string[];
  setSelectedAuthors: (val: string[]) => void;
  codeAvail: CodeAvail;
  setCodeAvail: (v: CodeAvail) => void;
  selectedTopicsI: string[];
  setSelectedTopicsI: (val: string[]) => void;
  selectedTopicsII: string[];
  setSelectedTopicsII: (val: string[]) => void;
  selectedTopicsIII: string[];
  setSelectedTopicsIII: (val: string[]) => void;
  matchMode: "any" | "all";
  setMatchMode: (v: "any" | "all") => void;
  onApplyFilters?: () => void;
  onClearFilters?: () => void;
  selectedMethods: string[];
  setSelectedMethods: (v: string[]) => void;
  selectedApplications: string[];
  setSelectedApplications: (v: string[]) => void;
};

const CONFERENCES = [
  { value: "ICLR", label: "ICLR" },
  { value: "ICML", label: "ICML" },
  { value: "KDD", label: "KDD" },
  { value: "NEURIPS", label: "NeurIPS" },
  { value: "ACL", label: "ACL" },
] as const;

const YEARS = ["2020", "2021", "2022", "2023", "2024", "2025"] as const;

const CODE_OPTS: { value: CodeAvail; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
];

const TOPIC_AXIS_I: { main: string; sub: string[] }[] = [
  { main: "Medical Imaging Analysis", sub: ["Radiology", "Digital Pathology", "Ophthalmology", "Other Imaging Modalities"] },
  { main: "Computational Genomics & Multi-Omics", sub: ["Genomics", "Transcriptomics", "Proteomics & Protein Structure", "Multi-Omics Integration"] },
  { main: "Drug Discovery & Development", sub: ["Target Identification & Validation", "Virtual Screening & Hit Generation", "De Novo Molecule Design", "ADMET & Trial Outcome Prediction"] },
  { main: "Clinical Data Science & Informatics", sub: ["EHR/EMR Predictive Modeling", "Clinical Natural Language Processing", "Physiological Time Series Analysis", "Digital Health & Wearable Sensor Data"] },
  { main: "Healthcare Systems & Operations", sub: ["Clinical Trial Optimization", "Hospital Operations Management", "Health Economics & Policy Modeling"] },
  { main: "Population Health & Computational Epidemiology", sub: ["Infectious Disease Modeling & Forecasting", "Public Health Surveillance", "Analysis of Social & Environmental Determinants of Health"] }
];

const TOPIC_AXIS_II: { main: string; sub: string[] }[] = [
  { main: "Generative & Foundation Models", sub: ["Large Language Models (LLMs)", "Vision Foundation Models (VFMs)", "Diffusion Models", "Other Generative Models"] },
  { main: "Data-Centric & Privacy-Enhancing AI", sub: ["Federated Learning", "Differential Privacy", "Self-Supervised & Unsupervised Learning", "Data-Efficient Learning"] },
  { main: "Causal Inference & Reasoning", sub: ["Causal Discovery", "Individualized Treatment Effect Estimation", "Causal Representation Learning"] },
  { main: "Sequential Decision Making & Reinforcement Learning", sub: ["Reinforcement Learning for Clinical Policy", "Dynamic Treatment Regimes", "Offline Reinforcement Learning"] },
  { main: "Advanced Supervised & Representation Learning", sub: ["Graph Representation Learning", "Novel Architectures for Time Series", "Disentangled Representation Learning"] }
];

const TOPIC_AXIS_III: { main: string; sub: string[] }[] = [
  { main: "Trustworthy AI: Fairness, Robustness & Safety", sub: ["Algorithmic Fairness & Bias Mitigation", "Model Robustness & Uncertainty Quantification", "Model Safety & Failure Detection"] },
  { main: "Explainability & Interpretability (XAI)", sub: ["Post-hoc Explanation Methods", "Inherently Interpretable Models", "Concept-based Explanations"] },
  { main: "Human-AI Interaction & Collaboration", sub: ["Clinician-in-the-loop Systems", "AI for Clinical Decision Support (CDS)", "Human-AI Collaborative Performance"] },
  { main: "Regulatory Science & Digital Biomarkers", sub: ["Development & Validation of Digital Biomarkers", "AI as a Medical Device (AIaMD) Methodologies", "Post-market Surveillance Models"] }
];

function Pill({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-3 py-1.5 text-sm rounded-full border transition shadow-sm",
        active
          ? "bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700 focus:ring-2 focus:ring-red-200"
          : "bg-white text-gray-700 border-gray-200 hover:text-red-700 hover:border-red-300 focus:ring-2 focus:ring-red-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Section({ title, count, children, onReset, showResetAlways }: { title: string | React.ReactNode; count?: number; children: React.ReactNode; onReset?: () => void; showResetAlways?: boolean; }) {
  const isDefaultOpen = title === "Conference" || title === "Year" || title === "Author";
  const [open, setOpen] = useState(isDefaultOpen);
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-red-100 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">{title}</span>
          {typeof count === "number" && (
            <span
              className={[
                "text-xs px-2 py-0.5 rounded-full",
                count > 0 ? "bg-red-50 text-red-700 ring-1 ring-red-100" : "bg-gray-100 text-gray-600",
              ].join(" ")}
            >
              {count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onReset && (showResetAlways || (count && count > 0)) && (
            <button
              className="text-xs text-red-700 hover:text-red-900 underline"
              onClick={(e) => {
                e.stopPropagation();
                onReset();
              }}
            >
              Resets
            </button>
          )}
          <button onClick={() => setOpen((v) => !v)} className="text-gray-500 hover:text-gray-700 transition">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function DropdownMulti({ placeholder, options, selected, onToggle, disabled }: { placeholder: string; options: string[]; selected: string[]; onToggle: (value: string) => void; disabled?: boolean; }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options;
    return options.filter((x) => x.toLowerCase().includes(s));
  }, [q, options]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={[
          "w-full text-left px-3 py-2 rounded-lg border shadow-sm bg-white text-sm flex flex-wrap gap-1 min-h-[2.5rem]",
          disabled ? "opacity-60 cursor-not-allowed" : "hover:border-red-300",
        ].join(" ")}
      >
        {selected.length ? (
          selected.map((opt) => (
            <span
              key={opt}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200"
            >
              {opt}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggle(opt)
                }}
                className="ml-1 text-red-500 hover:text-red-700 focus:outline-none"
              >
                ×
              </button>
            </span>
          ))
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
      </button>
      {open && !disabled && (
        <div className="relative mt-1 w-full rounded-xl border-2 border-red-400 bg-white shadow-lg z-10">
          <div className="p-2 border-b">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search..."
              className="w-full px-2 py-1.5 rounded-md border border-blue-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.map((opt) => {
              const active = selected.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => {
                    onToggle(opt);
                    setOpen(false);
                  }}
                  className={["w-full text-left px-3 py-1.5 rounded-md text-sm", active ? "bg-red-600 text-white" : "hover:bg-red-100"].join(" ")}
                >
                  {opt}
                </button>
              );
            })}
            {!filtered.length && <div className="px-3 py-2 text-sm text-gray-500">No results</div>}
          </div>
        </div>
      )}
    </div>
  );
}

const toggleMain = (val: string, arr: string[], setter: (v: string[]) => void, axisData: { main: string; sub: string[] }[]) => {
  if (arr.includes(val)) {
    const subs = axisData.find((t) => t.main === val)?.sub || [];
    setter(arr.filter((x) => x !== val && !subs.includes(x)));
  } else {
    setter([...arr, val]);
  }
};

const SidebarFilters: React.FC<Props> = ({
  selectedConfs,
  setSelectedConfs,
  selectedYears,
  setSelectedYears,
  selectedAuthors,
  setSelectedAuthors,
  codeAvail,
  setCodeAvail,
  selectedTopicsI,
  setSelectedTopicsI,
  selectedTopicsII,
  setSelectedTopicsII,
  selectedTopicsIII,
  setSelectedTopicsIII,
  matchMode,
  setMatchMode,
  onApplyFilters,
  onClearFilters,
  selectedMethods,
  setSelectedMethods,
  selectedApplications,
  setSelectedApplications,
}) => {
  const [methodQuery, setMethodQuery] = useState("")
  const [openGroups, setOpenGroups] = useState<string[]>([])
  const [applicationQuery, setApplicationQuery] = useState("")
  const [openAppGroups, setOpenAppGroups] = useState<string[]>([])

  const allApplications = ["Neural Activity Analysis (Electrophysiology)", "Molecular Property Prediction", "Histopathology Image Analysis", "Protein Structure Prediction", "Medical Image Classification", "Mental Health Counseling Analysis", "Electrocardiogram Signal Classification", "Clinical Diagnosis Prediction", "Molecule Generation", "Personalized Treatment Prediction", "Gene Regulatory Network Inference", "Drug Interaction Prediction", "Treatment Effect Estimation", "3D Structure Reconstruction", "Medical Image Segmentation", "Antibody Design Optimization", "Spatial Transcriptomics Analysis", "Genomic Data Analysis", "Protein Structure Function Prediction", "Biomedical Information Extraction", "Cancer Prognosis Prediction", "Medical Image Reconstruction", "High-dimensional Biomedical Data Analysis", "Medical Image Anomaly Detection", "Molecular Property Optimization", "Neural Dynamics Modeling", "Neural Activity Decoding", "Functional Magnetic Resonance Imaging Analysis", "Disease Classification", "Electroencephalography Seizure Detection", "Radiology Report Generation", "Treatment Regimen Optimization", "Molecular Docking Prediction", "Clinical Outcome Prediction", "Protein Structure and Function Prediction", "Genetic Variant Effect Prediction", "Clinical Decision Policy Optimization", "Molecule Generation and Optimization", "Single Cell Trajectory Inference", "Peptide Sequencing", "Clinical Outcome Prediction", "Alzheimer's Disease Prediction", "Biological Sequence Optimization", "Electronic Health Record Phenotyping", "Electroencephalography Sleep Staging", "Medical Question Answering", "Protein Sequence Design", "Physiological Time Series Analysis", "Clinical Outcome Prediction", "Others"]

  const filteredApplications = useMemo(() => {
    const q = applicationQuery.trim().toLowerCase()
    return allApplications.filter((a) => a.toLowerCase().includes(q))
  }, [applicationQuery])

  const filteredApplicationGroups = useMemo(() => {
    const groups: Record<string, string[]> = {}
    filteredApplications.forEach((a) => {
      const letter = a[0].toUpperCase()
      if (!groups[letter]) groups[letter] = []
      groups[letter].push(a)
    })
    return Object.entries(groups).map(([letter, items]) => ({ letter, items }))
  }, [filteredApplications])

  const toggleAppGroup = (letter: string) =>
    setOpenAppGroups((prev) =>
      prev.includes(letter)
        ? prev.filter((l) => l !== letter)
        : [...prev, letter]
    )

  const allMethods = [
    "Active Learning","Adversarial Learning","Attention Mechanisms","Autoregressive Modeling","Bayesian Inference","Bayesian Optimization","Causal Inference","Causal Modeling","Clustering Methods","Conformal Prediction","Contrastive Learning","Convolutional and Graph Convolutional Networks (CNN/GCN)","Curriculum Learning","Data Augmentation","Deep Neural Networks","Dimensionality Reduction","Encoder Decoder Models","Energy-Based Models (EBMs)","Evolutionary Algorithms","Expectation Maximization Algorithm","Few-shot Learning","Fine Tuning","Flow Matching","Gaussian Processes","Generative Flow Networks","Generative Modeling","Geometric Deep Learning","Gradient Descent Optimization","Graph Neural Networks","Graph Representation Learning","Importance Sampling","Knowledge Distillation","Knowledge Extraction","Knowledge Graph Representation Learning","Knowledge Guided Learning","Large Language Models","Latent State-Space Models (LSSMs)","Linear Regression","Masked Autoencoder Models (MAE)","Masked Language Modeling (MLM)","Message Passing Neural Networks","Meta Learning","Mixture of Experts","Model Evaluation Techniques","Molecular Representation Learning","Monte Carlo Methods","Multi Task Learning","Multi-Agent Systems","Multimodal Alignment","Mutual Information Maximization","Neural Ordinary Differential Equations","Normalizing Flows","Optimal Transport","Pretrained Language Models","Principal Component Analysis","Recurrent Neural Networks (RNNs)","Regularization Techniques","Reinforcement Learning","Representation Learning","Retrieval Augmented Generation","Sampling Methods","Score Based Diffusion","Score Based Diffusion Models","Score Matching","Self-supervised Learning","Tokenization Methods","Transformer Models","Variational Autoencoders","Variational Inference","Vector Quantization","Vision Transformers (ViTs)","Others"
  ]
  const filteredMethods = useMemo(() => {
    const q = methodQuery.trim().toLowerCase()
    return allMethods.filter((m) => m.toLowerCase().includes(q))
  }, [methodQuery])
  const filteredMethodGroups = useMemo(() => {
    const groups: Record<string, string[]> = {}
    filteredMethods.forEach((m) => {
      const letter = m[0].toUpperCase()
      if (!groups[letter]) groups[letter] = []
      groups[letter].push(m)
    })
    return Object.entries(groups).map(([letter, items]) => ({ letter, items }))
  }, [filteredMethods])
  const toggleGroup = (letter: string) => setOpenGroups((prev) => (prev.includes(letter) ? prev.filter((l) => l !== letter) : [...prev, letter]))

  const [authorQuery, setAuthorQuery] = useState("");
  const [allAuthors, setAllAuthors] = useState<string[]>([]);
  const [loadingAuthors, setLoadingAuthors] = useState(false);
  const deferredQuery = useDeferredValue(authorQuery);
  useEffect(() => {
    let mounted = true;
    setLoadingAuthors(true);
    fetch(`${process.env.NEXT_PUBLIC_API_TARGET}/authors`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setAllAuthors(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!mounted) return;
        setAllAuthors([]);
      })
      .finally(() => mounted && setLoadingAuthors(false));
    return () => {
      mounted = false;
    };
  }, []);
  const toggle = (val: string, arr: string[], setter: (v: string[]) => void) => arr.includes(val) ? setter(arr.filter((v) => v !== val)) : setter([...arr, val]);
  const filteredAuthors = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const pinned = [...selectedAuthors];
    const pool = q ? allAuthors.filter((a) => a.toLowerCase().includes(q)) : allAuthors;
    const rest = pool.filter((a) => !selectedAuthors.includes(a));
    return [...pinned, ...rest];
  }, [deferredQuery, allAuthors, selectedAuthors]);
  const Row = ({ index, style }: ListChildComponentProps) => {
    const author = filteredAuthors[index];
    const checked = selectedAuthors.includes(author);
    return (
      <label style={style} className="flex items-center gap-2 rounded-lg px-2 cursor-pointer hover:bg-red-50 text-sm text-gray-800">
        <input type="checkbox" className="accent-red-700" checked={checked} onChange={() => toggle(author, selectedAuthors, setSelectedAuthors)} />
        <span className="truncate">{author}</span>
      </label>
    );
  };
  const axisIMains = useMemo(() => TOPIC_AXIS_I.map((t) => t.main), []);
  const axisISelectedMains = useMemo(() => selectedTopicsI.filter((x) => axisIMains.includes(x)), [selectedTopicsI, axisIMains]);
  const axisISubs = useMemo(() => {
    const set = new Set<string>();
    TOPIC_AXIS_I.forEach((t) => {
      if (axisISelectedMains.includes(t.main)) t.sub.forEach((s) => set.add(s));
    });
    return Array.from(set);
  }, [axisISelectedMains]);
  const axisIIMains = useMemo(() => TOPIC_AXIS_II.map((t) => t.main), []);
  const axisIISelectedMains = useMemo(() => selectedTopicsII.filter((x) => axisIIMains.includes(x)), [selectedTopicsII, axisIIMains]);
  const axisIISubs = useMemo(() => {
    const set = new Set<string>();
    TOPIC_AXIS_II.forEach((t) => {
      if (axisIISelectedMains.includes(t.main)) t.sub.forEach((s) => set.add(s));
    });
    return Array.from(set);
  }, [axisIISelectedMains]);
  const axisIIIMains = useMemo(() => TOPIC_AXIS_III.map((t) => t.main), []);
  const axisIIISelectedMains = useMemo(() => selectedTopicsIII.filter((x) => axisIIIMains.includes(x)), [selectedTopicsIII, axisIIIMains]);
  const axisIIISubs = useMemo(() => {
    const set = new Set<string>();
    TOPIC_AXIS_III.forEach((t) => {
      if (axisIIISelectedMains.includes(t.main)) t.sub.forEach((s) => set.add(s));
    });
    return Array.from(set);
  }, [axisIIISelectedMains]);
  return (
    <div className="w-60 md:w-64 lg:w-75 xl:w-88 2xl:w-89 fixed left-0 top-16 h-[calc(100dvh-4rem)] px-4 lg:px-6 py-4 lg:py-6 border-r border-red-100 bg-gradient-to-b from-white to-amber-50 overflow-y-scroll">
      <div className="space-y-4 text-gray-800">
        <Section title="Conference" count={selectedConfs.length} onReset={() => setSelectedConfs([])}>
          <div className="flex gap-2 flex-nowrap overflow-x-auto">
            {CONFERENCES.map(({ value, label }) => (
              <Pill key={value} active={selectedConfs.includes(value)} onClick={() => toggle(value, selectedConfs, setSelectedConfs)}>
                {label}
              </Pill>
            ))}
          </div>
        </Section>
        <Section title="Year" count={selectedYears.length} onReset={() => setSelectedYears([])}>
          <div className="flex flex-wrap gap-2">
            {YEARS.map((y) => (
              <Pill key={y} active={selectedYears.includes(y)} onClick={() => toggle(y, selectedYears, setSelectedYears)}>
                {y}
              </Pill>
            ))}
          </div>
        </Section>
        <Section title="Author" count={selectedAuthors.length} onReset={() => { setSelectedAuthors([]); setAuthorQuery(""); }} showResetAlways>
          <div className="mb-2">
            <div className="rounded-xl p-[2px] bg-gradient-to-r from-red-700 via-rose-600 to-pink-600 shadow-[0_0_0_1px_rgba(0,0,0,0.02)]">
              <div className="relative">
                <input type="text" placeholder="Search author..." value={authorQuery} onChange={(e) => setAuthorQuery(e.target.value)} className="w-full bg-white rounded-[10px] px-3 pr-9 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-200" />
                {authorQuery && (
                  <button aria-label="clear" onClick={() => setAuthorQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-sm">
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-600 mb-1">{loadingAuthors ? "Loading..." : `Showing ${filteredAuthors.length} / ${allAuthors.length}`}</div>
          <div className="w-full rounded-xl border border-red-100 bg-white">
            <VList height={180} width={"100%"} itemCount={filteredAuthors.length} itemSize={32}>{Row}</VList>
          </div>
        </Section>
        <Section title="Code" count={codeAvail !== "any" ? 1 : 0} onReset={() => setCodeAvail("any")}>
          <div className="flex gap-2">
            {CODE_OPTS.map((o) => (
              <Pill key={o.value} active={codeAvail === o.value} onClick={() => setCodeAvail(o.value)}>
                {o.label}
              </Pill>
            ))}
          </div>
        </Section>
        <Section
          title={
            <div className="flex flex-col w-full">
              <span>Topic Filters</span>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMatchMode("any");
                  }}
                  className={`text-xs px-2 py-1 rounded border ${
                    matchMode === "any"
                      ? "bg-red-600 text-white border-red-600"
                      : "border-red-400 text-red-600 hover:bg-red-50"
                  }`}
                >
                  Match Any
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMatchMode("all");
                  }}
                  className={`text-xs px-2 py-1 rounded border ${
                    matchMode === "all"
                      ? "bg-red-600 text-white border-red-600"
                      : "border-red-400 text-red-600 hover:bg-red-50"
                  }`}
                >
                  Match All
                </button>
              </div>
            </div>
          }
          count={selectedTopicsI.length + selectedTopicsII.length + selectedTopicsIII.length}
          onReset={() => {
            setSelectedTopicsI([]);
            setSelectedTopicsII([]);
            setSelectedTopicsIII([]);
            setMatchMode("any");
          }}
        >
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">
                Axis I: Application Domains <span className="text-gray-400 text-xs">(What)</span>
              </div>
              <DropdownMulti
                placeholder="Select Main Topic"
                options={axisIMains}
                selected={axisISelectedMains}
                onToggle={(v) => toggleMain(v, selectedTopicsI, setSelectedTopicsI, TOPIC_AXIS_I)}
              />
              <div className="mt-2">
                <DropdownMulti
                  placeholder="Select SubTopic"
                  options={axisISubs}
                  selected={selectedTopicsI.filter((x) => axisISubs.includes(x))}
                  onToggle={(v) => toggle(v, selectedTopicsI, setSelectedTopicsI)}
                />
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">
                Axis II: Methodology <span className="text-gray-400 text-xs">(How)</span>
              </div>
              <DropdownMulti
                placeholder="Select Main Topic"
                options={axisIIMains}
                selected={axisIISelectedMains}
                onToggle={(v) => toggleMain(v, selectedTopicsII, setSelectedTopicsII, TOPIC_AXIS_II)}
              />
              <div className="mt-2">
                <DropdownMulti
                  placeholder="Select SubTopic"
                  options={axisIISubs}
                  selected={selectedTopicsII.filter((x) => axisIISubs.includes(x))}
                  onToggle={(v) => toggle(v, selectedTopicsII, setSelectedTopicsII)}
                />
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">
                Axis III: Translation & Deployment <span className="text-gray-400 text-xs">(How Well)</span>
              </div>
              <DropdownMulti
                placeholder="Select Main Topic"
                options={axisIIIMains}
                selected={axisIIISelectedMains}
                onToggle={(v) => toggleMain(v, selectedTopicsIII, setSelectedTopicsIII, TOPIC_AXIS_III)}
              />
              <div className="mt-2">
                <DropdownMulti
                  placeholder="Select SubTopic"
                  options={axisIIISubs}
                  selected={selectedTopicsIII.filter((x) => axisIIISubs.includes(x))}
                  onToggle={(v) => toggle(v, selectedTopicsIII, setSelectedTopicsIII)}
                />
              </div>
            </div>
          </div>
        </Section>

        <Section title="Method" count={selectedMethods?.length || 0} onReset={() => setSelectedMethods([])}>
          <div className="mb-2">
            <div className="flex flex-wrap items-center gap-1 bg-white rounded-lg border border-red-200 px-2 py-1.5 text-sm focus-within:ring-2 focus-within:ring-red-200">
              {selectedMethods.slice(0, 2).map((m) => (
                <span key={m} className="flex items-center bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">
                  {m.length > 15 ? m.slice(0, 15) + "…" : m}
                  <button
                    onClick={() => toggle(m, selectedMethods, setSelectedMethods)}
                    className="ml-1 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </span>
              ))}
              {selectedMethods.length > 2 && (
                <span className="text-xs text-gray-500">+{selectedMethods.length - 2}</span>
              )}
              <input
                type="text"
                placeholder="Search method..."
                value={methodQuery}
                onChange={(e) => setMethodQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm px-1 py-0.5"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto rounded-xl border border-red-100 bg-white divide-y divide-red-50">
            {filteredMethodGroups.map(({ letter, items }) => (
              <div key={letter}>
                <button onClick={() => toggleGroup(letter)} className="w-full flex justify-between items-center px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50">
                  <span>{letter}</span>
                  <span>{openGroups.includes(letter) ? "–" : "+"}</span>
                </button>
                {openGroups.includes(letter) && (
                  <div className="pl-3 pb-1">
                    {items.map((m) => {
                      const checked = selectedMethods.includes(m);
                      return (
                        <label key={m} className="flex items-center gap-2 px-2 py-1 text-sm cursor-pointer hover:bg-red-50">
                          <input type="checkbox" className="accent-red-700" checked={checked} onChange={() => toggle(m, selectedMethods, setSelectedMethods)} />
                          <span className="truncate">{m}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
        <Section title="Application" count={selectedApplications.length} onReset={() => setSelectedApplications([])}>
        <div className="flex flex-wrap items-center gap-1 bg-white rounded-lg border border-red-200 px-2 py-1.5 text-sm mb-2 focus-within:ring-2 focus-within:ring-red-200">
          {selectedApplications.slice(0, 2).map((a) => (
            <span key={a} className="flex items-center bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">
              {a.length > 15 ? a.slice(0, 15) + "…" : a}
              <button
                onClick={() => toggle(a, selectedApplications, setSelectedApplications)}
                className="ml-1 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </span>
          ))}
          {selectedApplications.length > 2 && (
            <span className="text-xs text-gray-500">+{selectedApplications.length - 2}</span>
          )}
          <input
            type="text"
            placeholder="Search application..."
            value={applicationQuery}
            onChange={(e) => setApplicationQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm px-1 py-0.5"
          />
        </div>

          <div className="max-h-52 overflow-y-auto rounded-xl border border-red-100 bg-white divide-y divide-red-50">
            {filteredApplicationGroups.map(({ letter, items }) => (
              <div key={letter}>
                <button
                  onClick={() => toggleAppGroup(letter)}
                  className="w-full flex justify-between items-center px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  <span>{letter}</span>
                  <span>{openAppGroups.includes(letter) ? "–" : "+"}</span>
                </button>
                {openAppGroups.includes(letter) && (
                  <div className="pl-3 pb-1">
                    {items.map((a) => {
                      const checked = selectedApplications.includes(a)
                      return (
                        <label key={a} className="flex items-center gap-2 px-2 py-1 text-sm cursor-pointer hover:bg-red-50">
                          <input
                            type="checkbox"
                            className="accent-red-700"
                            checked={checked}
                            onChange={() => toggle(a, selectedApplications, setSelectedApplications)}
                          />
                          <span className="truncate">{a}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>

        <div className="flex gap-2 pt-2">
        <button
          onClick={() => {
            if (onApplyFilters) onApplyFilters();
          }}
          className="flex-1 bg-gradient-to-r from-red-700 to-rose-600 text-white px-4 py-2 rounded-xl shadow-sm hover:from-red-800 hover:to-rose-700 active:scale-[0.99] transition"
        >
          Apply Filters
        </button>
          <button
            onClick={() => {
              setSelectedConfs([])
              setSelectedYears([])
              setSelectedAuthors([])
              setCodeAvail("any")
              setSelectedTopicsI([])
              setSelectedTopicsII([])
              setSelectedTopicsIII([])
              setMatchMode("any")
              setAuthorQuery("")
              setSelectedMethods([])
              setSelectedApplications([])
              onClearFilters?.()
            }}
            className="border border-gray-300 text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-50"
          >
            Clear
          </button>

        </div>
      </div>
    </div>
  );
};
export default SidebarFilters;
