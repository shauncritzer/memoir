import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function RewiredMethod() {
  const [openSection, setOpenSection] = useState<string | null>("recognize");

  const sections = [
    {
      id: "recognize",
      letter: "R",
      title: "Recognize Your State",
      color: "blue",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      iconBg: "bg-blue-500",
      lie: '"I just need to be stronger."',
      truth: '"I need to know where I am before I can get where I\'m going."',
      description:
        "Recovery starts with awareness. Before you can change your state, you have to be able to recognize it. This first step is about learning the language of your nervous system. You'll learn to identify the subtle cues of hyperarousal (anxiety, racing thoughts, agitation) and hypoarousal (numbness, disconnection, shutdown) in your body. This isn't about judgment; it's about compassionate observation.",
      prompt:
        "Look around you right now and find one object that brings you a sense of calm or stability. It could be a plant, a photo, or the feeling of your feet on the floor. What is it, and why does it make you feel grounded?",
    },
    {
      id: "establish",
      letter: "E",
      title: "Establish Safety",
      color: "green",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      iconBg: "bg-green-500",
      lie: '"I\'m not safe until this feeling goes away."',
      truth: '"I can create safety for myself, right here, right now."',
      description:
        "Your nervous system is constantly scanning for threats. For those of us with a history of trauma or chronic stress, that alarm system is often set too high. This step is about learning to consciously create a sense of safety in your own body, even when your mind is telling you you're in danger. You'll learn grounding techniques, orienting exercises, and how to use your senses to anchor yourself in the present moment.",
      prompt:
        "Look around you right now and find one object that brings you a sense of calm or stability. It could be a plant, a photo, or the feeling of your feet on the floor. What is it, and why does it make you feel grounded?",
    },
    {
      id: "work",
      letter: "W",
      title: "Work with the Body",
      color: "purple",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      iconBg: "bg-purple-500",
      lie: '"I need to think my way out of this."',
      truth: '"My body holds the key to my healing."',
      description:
        "Addiction isn't just a mental health issue—it's a whole-body experience. This step is about learning to work directly with your nervous system through somatic practices. You'll explore breathwork, movement, and body-based techniques that help release stored trauma and regulate your emotional state. This is where the healing happens—not in your head, but in your body.",
      prompt:
        "Take a moment to notice your breath. Is it shallow or deep? Fast or slow? Without changing it, just observe. Now take three slow, deep breaths. What do you notice in your body after those three breaths?",
    },
    {
      id: "integrate",
      letter: "I",
      title: "Integrate New Patterns",
      color: "orange",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      iconBg: "bg-orange-500",
      lie: '"I\'ll never be able to change."',
      truth: '"Small, consistent actions create lasting change."',
      description:
        "Healing isn't a one-time event—it's a practice. This step is about taking what you've learned and weaving it into your daily life. You'll create sustainable routines, build new neural pathways, and develop the consistency that transforms temporary relief into lasting change. This is where recovery becomes a lifestyle, not just a goal.",
      prompt:
        "Think of one small action you could take every day that would support your recovery. It doesn't have to be big—maybe it's five minutes of breathwork, a short walk, or checking in with a friend. What is it, and when will you do it?",
    },
    {
      id: "release",
      letter: "R",
      title: "Release What No Longer Serves",
      color: "red",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      iconBg: "bg-red-500",
      lie: '"I deserve to suffer for what I\'ve done."',
      truth: '"I can let go of shame and still hold myself accountable."',
      description:
        "Shame is the fuel that keeps addiction alive. This step is about learning to release the toxic beliefs, old identities, and self-sabotaging patterns that no longer serve you. You'll explore self-forgiveness, grief work, and the art of letting go. This isn't about forgetting the past—it's about freeing yourself from its grip.",
      prompt:
        "Write down one belief about yourself that you know is holding you back. It might be 'I'm broken,' 'I'm not worthy,' or 'I'll never change.' Now write a new truth to replace it. What would you rather believe about yourself?",
    },
    {
      id: "embrace",
      letter: "E",
      title: "Embrace Your New Identity",
      color: "teal",
      bgColor: "bg-teal-50",
      borderColor: "border-teal-200",
      iconBg: "bg-teal-500",
      lie: '"I\'m just a person in recovery."',
      truth: '"I\'m becoming the person I was always meant to be."',
      description:
        "Recovery isn't just about what you stop doing—it's about who you become. This step is about stepping into your new identity with confidence and clarity. You'll explore your values, strengths, and the vision you have for your life. This is where you stop defining yourself by your past and start living into your future.",
      prompt:
        "Imagine yourself one year from now, fully embodying the person you want to become. What does that version of you do differently? How do they show up in the world? Write down three specific qualities or habits they have.",
    },
    {
      id: "discover",
      letter: "D",
      title: "Discover Your Purpose",
      color: "indigo",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      iconBg: "bg-indigo-500",
      lie: '"My life has no meaning."',
      truth: '"My pain has prepared me for my purpose."',
      description:
        "The final step is about discovering what you're here to do. Not in some grand, cosmic sense—but in the everyday, practical sense of finding meaning in your life. You'll explore how your story can serve others, how your struggles have prepared you for your purpose, and how to live a life that feels aligned with your deepest values. This is where recovery becomes more than survival—it becomes a calling.",
      prompt:
        "Think about a time when you helped someone else, even in a small way. How did it make you feel? What does that tell you about the kind of impact you want to have in the world?",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-16 px-4">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            The Interactive REWIRED Journey
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore each step of the REWIRED framework. Click on any section to
            dive deeper into the transformative process.
          </p>
        </div>

        {/* Accordion Sections */}
        <div className="space-y-4">
          {sections.map((section) => {
            const isOpen = openSection === section.id;
            return (
              <div
                key={section.id}
                className={`rounded-lg border-2 ${section.borderColor} ${section.bgColor} overflow-hidden transition-all duration-300`}
              >
                {/* Section Header */}
                <button
                  onClick={() =>
                    setOpenSection(isOpen ? null : section.id)
                  }
                  className="w-full p-6 flex items-center gap-4 text-left hover:opacity-80 transition-opacity"
                >
                  <div
                    className={`${section.iconBg} text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0`}
                  >
                    {section.letter}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {section.title}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Click to explore
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-6 h-6 text-gray-600 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Section Content */}
                {isOpen && (
                  <div className="px-6 pb-6 space-y-6 animate-in fade-in duration-300">
                    {/* The Lie & The Truth */}
                    <div className="space-y-4">
                      <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          The Lie:
                        </p>
                        <p className="text-lg italic text-gray-900">
                          {section.lie}
                        </p>
                      </div>
                      <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          The Truth:
                        </p>
                        <p className="text-lg italic text-gray-900">
                          {section.truth}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="max-w-none">
                      <p className="text-gray-700 leading-relaxed">
                        {section.description}
                      </p>
                    </div>

                    {/* Reflection Prompt */}
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                      <p className="text-sm font-semibold text-gray-700 mb-3">
                        Reflection Prompt:
                      </p>
                      <p className="text-gray-700 leading-relaxed mb-4">
                        {section.prompt}
                      </p>
                      <textarea
                        placeholder="Type your response here..."
                        className="w-full min-h-[120px] p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center bg-white rounded-lg p-8 shadow-sm border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Begin Your REWIRED Journey?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            The 7-Day REWIRED Reset takes you through each of these steps with
            video lessons, workbooks, and practical tools.
          </p>
          <a
            href="/products"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Explore Programs
          </a>
        </div>
      </div>
    </div>
  );
}
