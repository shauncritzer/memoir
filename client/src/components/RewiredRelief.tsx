import { useState } from 'react';
import { X, Wind, Heart, Sparkles, Phone } from 'lucide-react';

type Tool = 'breathwork' | 'gratitude' | 'affirmations' | 'crisis' | null;

export default function RewiredRelief() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>(null);
  const [breathCount, setBreathCount] = useState(0);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold1' | 'exhale' | 'hold2'>('inhale');
  const [gratitudeAnswers, setGratitudeAnswers] = useState(['', '', '']);
  const [currentAffirmation, setCurrentAffirmation] = useState(0);

  const affirmations = [
    "My nervous system is learning new patterns of safety.",
    "I am building healthy ways to regulate my emotions.",
    "Every moment of calm rewires my brain for peace.",
    "I am patient with my healing journey.",
    "My body knows how to find safety and rest.",
    "I choose regulation over reaction.",
    "I am worthy of peace and healing.",
    "Each breath brings me closer to balance.",
  ];

  const gratitudePrompts = [
    "What's one thing that went right today?",
    "Who is someone you're grateful for right now?",
    "What's one thing about yourself you appreciate?"
  ];

  // Box Breathing Timer Logic
  const startBreathwork = () => {
    setActiveTool('breathwork');
    setBreathCount(0);
    setBreathPhase('inhale');
    runBreathCycle();
  };

  const runBreathCycle = () => {
    const phases = ['inhale', 'hold1', 'exhale', 'hold2'] as const;
    let currentPhaseIndex = 0;
    let count = 0;

    const interval = setInterval(() => {
      currentPhaseIndex = (currentPhaseIndex + 1) % 4;
      setBreathPhase(phases[currentPhaseIndex]);

      if (currentPhaseIndex === 0) {
        count++;
        setBreathCount(count);

        if (count >= 5) {
          clearInterval(interval);
        }
      }
    }, 4000); // 4 seconds per phase
  };

  const getBreathInstruction = () => {
    switch (breathPhase) {
      case 'inhale': return 'Breathe In (4)';
      case 'hold1': return 'Hold (4)';
      case 'exhale': return 'Breathe Out (4)';
      case 'hold2': return 'Hold (4)';
    }
  };

  const renderToolContent = () => {
    switch (activeTool) {
      case 'breathwork':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-center">Box Breathing</h3>
            <p className="text-gray-600 text-center">
              Follow the rhythm. 4 counts each phase.
            </p>

            <div className="flex flex-col items-center space-y-4">
              <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-1000 ${
                breathPhase === 'inhale' ? 'scale-110 border-blue-500 bg-blue-50' :
                breathPhase === 'exhale' ? 'scale-90 border-purple-500 bg-purple-50' :
                'border-gray-400 bg-gray-50'
              }`}>
                <Wind className="w-12 h-12 text-gray-700" />
              </div>

              <div className="text-xl font-semibold text-center">
                {getBreathInstruction()}
              </div>

              <div className="text-sm text-gray-500">
                Round {breathCount} of 5
              </div>
            </div>

            {breathCount === 0 && (
              <button
                onClick={startBreathwork}
                className="w-full py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600"
              >
                Start Breathing Exercise
              </button>
            )}

            {breathCount >= 5 && (
              <div className="text-center space-y-2">
                <p className="text-green-600 font-semibold">✓ Complete!</p>
                <p className="text-gray-600 text-sm">Notice how your nervous system feels now.</p>
              </div>
            )}
          </div>
        );

      case 'gratitude':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-center">Quick Gratitude Check</h3>
            <p className="text-gray-600 text-center">
              Gratitude regulates your nervous system by shifting focus to safety.
            </p>

            <div className="space-y-4">
              {gratitudePrompts.map((prompt, index) => (
                <div key={index} className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">{prompt}</label>
                  <textarea
                    value={gratitudeAnswers[index]}
                    onChange={(e) => {
                      const newAnswers = [...gratitudeAnswers];
                      newAnswers[index] = e.target.value;
                      setGratitudeAnswers(newAnswers);
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    rows={2}
                    placeholder="Type your answer..."
                  />
                </div>
              ))}
            </div>

            {gratitudeAnswers.every(a => a.trim()) && (
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 font-semibold">✓ Nice work!</p>
                <p className="text-green-600 text-sm mt-1">
                  You just gave your nervous system a dose of safety.
                </p>
              </div>
            )}
          </div>
        );

      case 'affirmations':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-center">Nervous System Affirmations</h3>
            <p className="text-gray-600 text-center">
              Read slowly. Let each word sink in.
            </p>

            <div className="p-8 bg-gradient-to-br from-amber-50 to-teal-50 rounded-lg border-2 border-amber-200 min-h-[200px] flex items-center justify-center">
              <p className="text-2xl font-serif text-center text-gray-800 leading-relaxed">
                "{affirmations[currentAffirmation]}"
              </p>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentAffirmation((prev) =>
                  prev === 0 ? affirmations.length - 1 : prev - 1
                )}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                ← Previous
              </button>

              <span className="text-sm text-gray-500">
                {currentAffirmation + 1} of {affirmations.length}
              </span>

              <button
                onClick={() => setCurrentAffirmation((prev) =>
                  (prev + 1) % affirmations.length
                )}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Next →
              </button>
            </div>
          </div>
        );

      case 'crisis':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-center">Crisis Resources</h3>
            <p className="text-gray-600 text-center">
              You don't have to face this alone. Help is available 24/7.
            </p>

            <div className="space-y-4">
              <a
                href="tel:988"
                className="block p-4 bg-red-50 border-2 border-red-500 rounded-lg hover:bg-red-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Phone className="w-6 h-6 text-red-600" />
                  <div>
                    <p className="font-bold text-red-900">988 Suicide & Crisis Lifeline</p>
                    <p className="text-sm text-red-700">Call or text 988</p>
                  </div>
                </div>
              </a>

              <a
                href="sms:741741"
                className="block p-4 bg-blue-50 border-2 border-blue-500 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Phone className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-bold text-blue-900">Crisis Text Line</p>
                    <p className="text-sm text-blue-700">Text HOME to 741741</p>
                  </div>
                </div>
              </a>

              <a
                href="tel:1-800-662-4357"
                className="block p-4 bg-purple-50 border-2 border-purple-500 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Phone className="w-6 h-6 text-purple-600" />
                  <div>
                    <p className="font-bold text-purple-900">SAMHSA Helpline</p>
                    <p className="text-sm text-purple-700">1-800-662-HELP (4357)</p>
                  </div>
                </div>
              </a>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Remember:</strong> Reaching out for help is a sign of strength, not weakness.
                Your nervous system is asking for support—that's healthy.
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setActiveTool('breathwork')}
              className="p-6 bg-blue-50 border-2 border-blue-500 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Wind className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="font-semibold text-blue-900">Breathwork</p>
              <p className="text-xs text-blue-700 mt-1">Box breathing exercise</p>
            </button>

            <button
              onClick={() => setActiveTool('gratitude')}
              className="p-6 bg-green-50 border-2 border-green-500 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Heart className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="font-semibold text-green-900">Gratitude</p>
              <p className="text-xs text-green-700 mt-1">Quick check-in</p>
            </button>

            <button
              onClick={() => setActiveTool('affirmations')}
              className="p-6 bg-amber-50 border-2 border-amber-500 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-amber-600" />
              <p className="font-semibold text-amber-900">Affirmations</p>
              <p className="text-xs text-amber-700 mt-1">Nervous system mantras</p>
            </button>

            <button
              onClick={() => setActiveTool('crisis')}
              className="p-6 bg-red-50 border-2 border-red-500 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Phone className="w-8 h-8 mx-auto mb-2 text-red-600" />
              <p className="font-semibold text-red-900">Crisis Support</p>
              <p className="text-xs text-red-700 mt-1">24/7 helplines</p>
            </button>
          </div>
        );
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-amber-500 to-teal-500 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 z-40"
      >
        <Sparkles className="w-5 h-5" />
        <span className="font-semibold">REWIRED Relief</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">REWIRED Relief</h2>
                <p className="text-sm text-gray-600">
                  {activeTool ? 'In-the-moment nervous system tools' : 'Choose a grounding tool'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setActiveTool(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {activeTool && (
                <button
                  onClick={() => setActiveTool(null)}
                  className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center"
                >
                  ← Back to tools
                </button>
              )}
              {renderToolContent()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
