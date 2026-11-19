import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  Layers,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Code,
  FileText,
  HelpCircle,
  X,
  Trash2
} from 'lucide-react';

export const FacultyQuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [subjectId, setSubjectId] = useState('');
  const [type, setType] = useState('MCQ_SINGLE');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [marks, setMarks] = useState(2);
  const [negativeMarks, setNegativeMarks] = useState(0.5);
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [explanation, setExplanation] = useState('');
  const [keywords, setKeywords] = useState('');

  // Options for MCQ
  const [options, setOptions] = useState([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);

  // Test cases for Coding
  const [testCases, setTestCases] = useState([
    { input: '', expectedOutput: '', isSample: true, isHidden: false },
    { input: '', expectedOutput: '', isSample: false, isHidden: true },
  ]);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [selectedSubject, selectedType]);

  const fetchQuestions = async () => {
    try {
      let url = '/faculty/question-bank';
      const params = new URLSearchParams();
      if (selectedSubject) params.append('subjectId', selectedSubject);
      if (selectedType) params.append('type', selectedType);
      if (params.toString()) url += `?${params.toString()}`;

      const [qRes, sRes] = await Promise.all([
        api.get(url),
        api.get('/admin/subjects'),
      ]);

      if (qRes.data.success) setQuestions(qRes.data.data);
      if (sRes.data.success) {
        setSubjects(sRes.data.data);
        if (sRes.data.data.length > 0 && !subjectId) {
          setSubjectId(sRes.data.data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let finalOptions = undefined;
      let finalTestCases = undefined;

      if (type === 'MCQ_SINGLE' || type === 'MCQ_MULTIPLE' || type === 'TRUE_FALSE') {
        finalOptions = options.filter((o) => o.text.trim());
      } else if (type === 'CODING') {
        finalTestCases = testCases.filter((tc) => tc.expectedOutput.trim());
      }

      const res = await api.post('/faculty/question-bank', {
        subjectId,
        type,
        title,
        content,
        marks,
        negativeMarks,
        difficulty,
        explanation,
        keywords: keywords ? keywords.split(',').map((k) => k.trim()) : undefined,
        options: finalOptions,
        testCases: finalTestCases,
      });

      if (res.data.success) {
        setShowModal(false);
        setTitle('');
        setContent('');
        setExplanation('');
        fetchQuestions();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeBadge = (t: string) => {
    switch (t) {
      case 'MCQ_SINGLE':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[10px] font-bold">MCQ Single</span>;
      case 'MCQ_MULTIPLE':
        return <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md text-[10px] font-bold">MCQ Multi</span>;
      case 'TRUE_FALSE':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md text-[10px] font-bold">True / False</span>;
      case 'SHORT_ANSWER':
        return <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded-md text-[10px] font-bold">Short Answer</span>;
      case 'DESCRIPTIVE':
        return <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-[10px] font-bold">Descriptive</span>;
      case 'CODING':
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold">Coding</span>;
      default:
        return null;
    }
  };

  const filteredQuestions = questions.filter((q) =>
    q.title.toLowerCase().includes(search.toLowerCase()) ||
    q.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Question Bank Repository</h1>
          <p className="text-sm text-slate-500 mt-1">Author and curate Multiple Choice Questions (Single & Multiple Correct) with positive & negative marking</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add MCQ Question</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="">All MCQ Types</option>
            <option value="MCQ_SINGLE">MCQ (Single Correct)</option>
            <option value="MCQ_MULTIPLE">MCQ (Multiple Correct)</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.map((q) => (
          <div key={q.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3 hover:border-brand-300 transition-all">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  {getTypeBadge(q.type)}
                  <span className="text-xs font-mono font-bold text-slate-500">{q.subject?.code}</span>
                  <span className="text-xs font-bold text-amber-600 px-2 py-0.5 bg-amber-50 rounded-md">
                    {q.difficulty}
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-1">{q.title}</h2>
              </div>
              <div className="text-right">
                <div className="text-sm font-extrabold text-brand-600">{q.marks} Marks</div>
                {q.negativeMarks > 0 && (
                  <div className="text-[11px] text-red-500 font-semibold">-{q.negativeMarks} penalty</div>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-600 whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100">
              {q.content}
            </p>

            {/* MCQ Options Preview */}
            {q.options && q.options.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {q.options.map((opt: any) => (
                  <div
                    key={opt.id}
                    className={`p-2 rounded-lg text-xs flex items-center justify-between border ${
                      opt.isCorrect
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>{opt.text}</span>
                    {opt.isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </div>
                ))}
              </div>
            )}

            {/* Coding Test Cases Preview */}
            {q.testCases && q.testCases.length > 0 && (
              <div className="pt-2 flex items-center space-x-3 text-xs text-slate-500">
                <Code className="w-4 h-4 text-emerald-600" />
                <span>
                  {q.testCases.filter((tc: any) => tc.isSample).length} Sample Test Cases •{' '}
                  {q.testCases.filter((tc: any) => tc.isHidden).length} Hidden Test Cases
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Question Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Add Question to Repository</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Subject
                  </label>
                  <select
                    required
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Question Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                  >
                    <option value="MCQ_SINGLE">MCQ (Single Correct Answer)</option>
                    <option value="MCQ_MULTIPLE">MCQ (Multiple Correct Answers)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Question Title / Topic
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Time Complexity of QuickSort"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Problem Description / Question Prompt
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter full question text, equations, or code snippet..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Marks
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    value={marks}
                    onChange={(e) => setMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Negative Penalty
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    value={negativeMarks}
                    onChange={(e) => setNegativeMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              {/* MCQ Options with A, B, C, D Labels */}
              <div className="space-y-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800">
                    Answer Options ({type === 'MCQ_SINGLE' ? 'Select single correct answer' : 'Select all correct answers'}):
                  </span>
                  {options.length < 6 && (
                    <button
                      type="button"
                      onClick={() => setOptions([...options, { text: '', isCorrect: false }])}
                      className="text-[11px] font-bold text-brand-600 hover:text-brand-700"
                    >
                      + Add Option
                    </button>
                  )}
                </div>

                {options.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx); // A, B, C, D...
                  return (
                    <div key={idx} className="flex items-center space-x-2.5">
                      <input
                        type={type === 'MCQ_SINGLE' ? 'radio' : 'checkbox'}
                        name="correctOpt"
                        checked={opt.isCorrect}
                        onChange={(e) => {
                          const updated = [...options];
                          if (type === 'MCQ_SINGLE') {
                            updated.forEach((o, i) => (o.isCorrect = i === idx));
                          } else {
                            updated[idx].isCorrect = e.target.checked;
                          }
                          setOptions(updated);
                        }}
                        className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 shrink-0"
                      />
                      <span className="w-6 text-xs font-bold font-mono text-slate-500">
                        {letter}.
                      </span>
                      <input
                        type="text"
                        required
                        placeholder={`Option ${letter} text`}
                        value={opt.text}
                        onChange={(e) => {
                          const updated = [...options];
                          updated[idx].text = e.target.value;
                          setOptions(updated);
                        }}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-500 disabled:opacity-50"
                >
                  {submitting ? 'Saving Question...' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
