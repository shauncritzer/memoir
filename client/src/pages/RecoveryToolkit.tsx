import { Navigation } from "@/components/Navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";
import { ChevronDown, ChevronUp, Download, Save, Calendar, Heart } from "lucide-react";
import { toast } from "sonner";

interface CheckInData {
  date: string;
  morningChecks: string[];
  gratitude: string;
  intention: string;
  reachOut: string;
  morningReflection: string;
  eveningChecks: string[];
  eveningReflection: string;
}

export default function RecoveryToolkit() {
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [hasAccess, setHasAccess] = useState(false);

  // Daily Check-In state
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
  const [morningChecks, setMorningChecks] = useState<string[]>([]);
  const [gratitude, setGratitude] = useState("");
  const [intention, setIntention] = useState("");
  const [reachOut, setReachOut] = useState("");
  const [morningReflection, setMorningReflection] = useState("");
  const [eveningChecks, setEveningChecks] = useState<string[]>([]);
  const [eveningReflection, setEveningReflection] = useState("");

  // Trigger Worksheet state
  const [peopleTriggers, setPeopleTriggers] = useState(["", "", ""]);
  const [placeTriggers, setPlaceTriggers] = useState(["", "", ""]);
  const [emotionalTriggers, setEmotionalTriggers] = useState<string[]>([]);
  const [actionPlan, setActionPlan] = useState(["", "", ""]);

  // Gratitude Journal state
  const [gratitudeDate, setGratitudeDate] = useState(new Date().toISOString().split('T')[0]);
  const [gratitudeEntries, setGratitudeEntries] = useState(["", "", ""]);
  const [personGratitude, setPersonGratitude] = useState("");
  const [recoveryGratitude, setRecoveryGratitude] = useState("");

  // Emergency Contact state
  const [sponsor, setSponsor] = useState({ name: "", phone: "" });
  const [therapist, setTherapist] = useState({ name: "", phone: "" });
  const [accountability, setAccountability] = useState({ name: "", phone: "" });
  const [sobrietyDate, setSobrietyDate] = useState("");

  // Milestones state
  const [milestones, setMilestones] = useState([
    { milestone: "24 hours sober", date: "", celebration: "", achieved: false },
    { milestone: "1 week sober", date: "", celebration: "", achieved: false },
    { milestone: "30 days sober", date: "", celebration: "", achieved: false },
    { milestone: "90 days sober", date: "", celebration: "", achieved: false },
    { milestone: "6 months sober", date: "", celebration: "", achieved: false },
    { milestone: "1 year sober", date: "", celebration: "", achieved: false },
  ]);

  useEffect(() => {
    // Check if user has access
    const storedEmail = localStorage.getItem("recoveryToolkitEmail");
    if (storedEmail) {
      setHasAccess(true);
      setEmail(storedEmail);
    }
  }, []);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    localStorage.setItem("recoveryToolkitEmail", email);
    setHasAccess(true);
    toast.success("Access granted! Your toolkit is ready.");
  };

  const toggleSection = (index: number) => {
    setExpandedSection(expandedSection === index ? null : index);
  };

  const saveCheckIn = () => {
    const checkIn: CheckInData = {
      date: checkInDate,
      morningChecks,
      gratitude,
      intention,
      reachOut,
      morningReflection,
      eveningChecks,
      eveningReflection,
    };

    const existingData = JSON.parse(localStorage.getItem("dailyCheckIns") || "[]");
    const updated = [...existingData.filter((c: CheckInData) => c.date !== checkInDate), checkIn];
    localStorage.setItem("dailyCheckIns", JSON.stringify(updated));
    toast.success("Check-in saved!");
  };

  const saveTriggerPlan = () => {
    const plan = { peopleTriggers, placeTriggers, emotionalTriggers, actionPlan };
    localStorage.setItem("triggerPlan", JSON.stringify(plan));
    toast.success("Trigger plan saved!");
  };

  const saveGratitudeEntry = () => {
    const entry = {
      date: gratitudeDate,
      entries: gratitudeEntries,
      person: personGratitude,
      recovery: recoveryGratitude,
    };

    const existing = JSON.parse(localStorage.getItem("gratitudeJournal") || "[]");
    const updated = [...existing.filter((e: any) => e.date !== gratitudeDate), entry];
    localStorage.setItem("gratitudeJournal", JSON.stringify(updated));
    toast.success("Gratitude entry saved!");
  };

  const saveEmergencyContacts = () => {
    const contacts = { sponsor, therapist, accountability, sobrietyDate };
    localStorage.setItem("emergencyContacts", JSON.stringify(contacts));
    toast.success("Emergency contacts saved!");
  };

  const saveMilestones = () => {
    localStorage.setItem("milestones", JSON.stringify(milestones));
    toast.success("Milestones saved!");
  };

  const morningCheckboxes = [
    "I woke up sober today",
    "I set my intention for the day",
    "I practiced gratitude",
    "I reached out to someone in recovery",
    "I meditated or prayed",
    "I moved my body"
  ];

  const eveningCheckboxes = [
    "I stayed sober today",
    "I attended a meeting or connected with my support network",
    "I practiced self-compassion",
    "I identified a trigger and used my tools",
    "I journaled or reflected",
    "I'm proud of myself today"
  ];

  const emotionalTriggerOptions = [
    "Anger", "Loneliness", "Stress", "Shame", "Anxiety",
    "Depression", "Fear", "Boredom", "Overwhelm"
  ];

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
          <Card className="max-w-md w-full mx-4 bg-gray-900 border-yellow-600/50">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Heart className="h-16 w-16 text-yellow-500 mx-auto" />
                <h2 className="text-2xl font-bold text-white">Access Your Recovery Toolkit</h2>
                <p className="text-gray-300">
                  Enter your email to unlock interactive worksheets, trackers, and resources for your recovery journey.
                </p>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-800 border-yellow-600/50 text-white"
                  />
                  <Button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold">
                    Get Free Access
                  </Button>
                </form>
                <p className="text-xs text-gray-400">
                  Your email is safe with us. No spam, ever.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black py-20">
        <div className="container max-w-4xl text-center space-y-6">
          <h1 className="text-5xl font-bold text-white">The Recovery Toolkit</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Practical, interactive worksheets for your recovery journey. All your entries are saved privately in your browser.
          </p>
        </div>
      </section>

      {/* Interactive Sections */}
      <section className="py-12">
        <div className="container max-w-4xl space-y-4">

          {/* Section 1: Daily Check-In */}
          <Card className="border-2 border-yellow-600/30">
            <button
              onClick={() => toggleSection(1)}
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-4">
                <Calendar className="h-6 w-6 text-yellow-600" />
                <h3 className="text-2xl font-bold">Daily Recovery Check-In</h3>
              </div>
              {expandedSection === 1 ? <ChevronUp /> : <ChevronDown />}
            </button>

            {expandedSection === 1 && (
              <CardContent className="space-y-6 border-t">
                <Input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="max-w-xs"
                />

                <div className="space-y-4">
                  <h4 className="font-bold text-lg">Morning Check-In</h4>
                  <div className="grid gap-3">
                    {morningCheckboxes.map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <Checkbox
                          checked={morningChecks.includes(item)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setMorningChecks([...morningChecks, item]);
                            } else {
                              setMorningChecks(morningChecks.filter(c => c !== item));
                            }
                          }}
                        />
                        <label className="text-sm">{item}</label>
                      </div>
                    ))}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Today I'm grateful for:</label>
                      <Input value={gratitude} onChange={(e) => setGratitude(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">My intention for today:</label>
                      <Input value={intention} onChange={(e) => setIntention(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">I will reach out to:</label>
                      <Input value={reachOut} onChange={(e) => setReachOut(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Morning reflection:</label>
                    <Textarea value={morningReflection} onChange={(e) => setMorningReflection(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t">
                  <h4 className="font-bold text-lg">Evening Check-In</h4>
                  <div className="grid gap-3">
                    {eveningCheckboxes.map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <Checkbox
                          checked={eveningChecks.includes(item)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setEveningChecks([...eveningChecks, item]);
                            } else {
                              setEveningChecks(eveningChecks.filter(c => c !== item));
                            }
                          }}
                        />
                        <label className="text-sm">{item}</label>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Evening reflection:</label>
                    <Textarea value={eveningReflection} onChange={(e) => setEveningReflection(e.target.value)} />
                  </div>
                </div>

                <Button onClick={saveCheckIn} className="bg-yellow-600 hover:bg-yellow-700 text-black">
                  <Save className="mr-2 h-4 w-4" />
                  Save Today's Check-In
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Section 2: Trigger Identification */}
          <Card className="border-2 border-yellow-600/30">
            <button
              onClick={() => toggleSection(2)}
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <h3 className="text-2xl font-bold">Trigger Identification Worksheet</h3>
              {expandedSection === 2 ? <ChevronUp /> : <ChevronDown />}
            </button>

            {expandedSection === 2 && (
              <CardContent className="space-y-6 border-t">
                <div className="space-y-4">
                  <div>
                    <label className="font-medium mb-2 block">People Triggers (Who makes you feel unsafe?):</label>
                    {peopleTriggers.map((trigger, idx) => (
                      <Input
                        key={idx}
                        value={trigger}
                        onChange={(e) => {
                          const updated = [...peopleTriggers];
                          updated[idx] = e.target.value;
                          setPeopleTriggers(updated);
                        }}
                        placeholder={`Person ${idx + 1}`}
                        className="mb-2"
                      />
                    ))}
                  </div>

                  <div>
                    <label className="font-medium mb-2 block">Place Triggers (Where do you feel triggered?):</label>
                    {placeTriggers.map((trigger, idx) => (
                      <Input
                        key={idx}
                        value={trigger}
                        onChange={(e) => {
                          const updated = [...placeTriggers];
                          updated[idx] = e.target.value;
                          setPlaceTriggers(updated);
                        }}
                        placeholder={`Place ${idx + 1}`}
                        className="mb-2"
                      />
                    ))}
                  </div>

                  <div>
                    <label className="font-medium mb-2 block">Emotional Triggers:</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {emotionalTriggerOptions.map((emotion) => (
                        <div key={emotion} className="flex items-center space-x-2">
                          <Checkbox
                            checked={emotionalTriggers.includes(emotion)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setEmotionalTriggers([...emotionalTriggers, emotion]);
                              } else {
                                setEmotionalTriggers(emotionalTriggers.filter(e => e !== emotion));
                              }
                            }}
                          />
                          <label className="text-sm">{emotion}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-medium mb-2 block">Action Plan (What will you do when triggered?):</label>
                    {actionPlan.map((plan, idx) => (
                      <Textarea
                        key={idx}
                        value={plan}
                        onChange={(e) => {
                          const updated = [...actionPlan];
                          updated[idx] = e.target.value;
                          setActionPlan(updated);
                        }}
                        placeholder={`Action step ${idx + 1}`}
                        className="mb-2"
                      />
                    ))}
                  </div>
                </div>

                <Button onClick={saveTriggerPlan} className="bg-yellow-600 hover:bg-yellow-700 text-black">
                  <Save className="mr-2 h-4 w-4" />
                  Save My Trigger Plan
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Section 3: Gratitude Journal */}
          <Card className="border-2 border-yellow-600/30">
            <button
              onClick={() => toggleSection(3)}
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <h3 className="text-2xl font-bold">Gratitude Practice Template</h3>
              {expandedSection === 3 ? <ChevronUp /> : <ChevronDown />}
            </button>

            {expandedSection === 3 && (
              <CardContent className="space-y-6 border-t">
                <Input
                  type="date"
                  value={gratitudeDate}
                  onChange={(e) => setGratitudeDate(e.target.value)}
                  className="max-w-xs"
                />

                <div className="space-y-4">
                  <label className="font-medium block">Three things I'm grateful for today:</label>
                  {gratitudeEntries.map((entry, idx) => (
                    <Textarea
                      key={idx}
                      value={entry}
                      onChange={(e) => {
                        const updated = [...gratitudeEntries];
                        updated[idx] = e.target.value;
                        setGratitudeEntries(updated);
                      }}
                      placeholder={`Gratitude ${idx + 1}`}
                    />
                  ))}

                  <div>
                    <label className="font-medium block mb-2">Someone I'm grateful for and why:</label>
                    <Textarea
                      value={personGratitude}
                      onChange={(e) => setPersonGratitude(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="font-medium block mb-2">Something in my recovery I'm grateful for:</label>
                    <Textarea
                      value={recoveryGratitude}
                      onChange={(e) => setRecoveryGratitude(e.target.value)}
                    />
                  </div>
                </div>

                <Button onClick={saveGratitudeEntry} className="bg-yellow-600 hover:bg-yellow-700 text-black">
                  <Save className="mr-2 h-4 w-4" />
                  Save Entry
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Section 4: Emergency Contacts */}
          <Card className="border-2 border-red-600/30">
            <button
              onClick={() => toggleSection(4)}
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <h3 className="text-2xl font-bold text-red-600">Emergency Contact Card</h3>
              {expandedSection === 4 ? <ChevronUp /> : <ChevronDown />}
            </button>

            {expandedSection === 4 && (
              <CardContent className="space-y-6 border-t">
                <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                  <p className="text-sm font-semibold text-red-900">Crisis Hotlines (24/7):</p>
                  <ul className="text-sm text-red-800 space-y-1 mt-2">
                    <li><strong>988 Suicide & Crisis Lifeline:</strong> Call or text 988</li>
                    <li><strong>SAMHSA National Helpline:</strong> 1-800-662-HELP (4357)</li>
                    <li><strong>Crisis Text Line:</strong> Text HOME to 741741</li>
                  </ul>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium block mb-2">Sponsor:</label>
                    <Input placeholder="Name" value={sponsor.name} onChange={(e) => setSponsor({...sponsor, name: e.target.value})} className="mb-2" />
                    <Input placeholder="Phone" value={sponsor.phone} onChange={(e) => setSponsor({...sponsor, phone: e.target.value})} />
                  </div>

                  <div>
                    <label className="font-medium block mb-2">Therapist:</label>
                    <Input placeholder="Name" value={therapist.name} onChange={(e) => setTherapist({...therapist, name: e.target.value})} className="mb-2" />
                    <Input placeholder="Phone" value={therapist.phone} onChange={(e) => setTherapist({...therapist, phone: e.target.value})} />
                  </div>

                  <div>
                    <label className="font-medium block mb-2">Accountability Partner:</label>
                    <Input placeholder="Name" value={accountability.name} onChange={(e) => setAccountability({...accountability, name: e.target.value})} className="mb-2" />
                    <Input placeholder="Phone" value={accountability.phone} onChange={(e) => setAccountability({...accountability, phone: e.target.value})} />
                  </div>

                  <div>
                    <label className="font-medium block mb-2">My Sobriety Date:</label>
                    <Input type="date" value={sobrietyDate} onChange={(e) => setSobrietyDate(e.target.value)} />
                  </div>
                </div>

                <Button onClick={saveEmergencyContacts} className="bg-red-600 hover:bg-red-700 text-white">
                  <Save className="mr-2 h-4 w-4" />
                  Save Emergency Contacts
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Section 5: Milestone Tracker */}
          <Card className="border-2 border-yellow-600/30">
            <button
              onClick={() => toggleSection(5)}
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <h3 className="text-2xl font-bold">Recovery Milestone Tracker</h3>
              {expandedSection === 5 ? <ChevronUp /> : <ChevronDown />}
            </button>

            {expandedSection === 5 && (
              <CardContent className="space-y-6 border-t">
                <div className="space-y-4">
                  {milestones.map((milestone, idx) => (
                    <div key={idx} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={milestone.achieved}
                          onCheckedChange={(checked) => {
                            const updated = [...milestones];
                            updated[idx].achieved = checked as boolean;
                            setMilestones(updated);
                          }}
                        />
                        <span className="font-semibold">{milestone.milestone}</span>
                      </div>
                      <div className="grid md:grid-cols-2 gap-2 ml-6">
                        <Input
                          type="date"
                          placeholder="Date achieved"
                          value={milestone.date}
                          onChange={(e) => {
                            const updated = [...milestones];
                            updated[idx].date = e.target.value;
                            setMilestones(updated);
                          }}
                        />
                        <Input
                          placeholder="How did you celebrate?"
                          value={milestone.celebration}
                          onChange={(e) => {
                            const updated = [...milestones];
                            updated[idx].celebration = e.target.value;
                            setMilestones(updated);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Button onClick={saveMilestones} className="bg-yellow-600 hover:bg-yellow-700 text-black">
                  <Save className="mr-2 h-4 w-4" />
                  Save Milestones
                </Button>
              </CardContent>
            )}
          </Card>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-gray-900 text-gray-300">
        <div className="container">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-white">Shaun Critzer</h3>
              <p className="text-sm">
                Author, speaker, and recovery advocate. 13 years sober and helping others find hope in their own journey.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/resources" className="hover:text-yellow-500 transition-colors">All Resources</Link></li>
                <li><Link href="/reading-guide" className="hover:text-yellow-500 transition-colors">Reading Guide</Link></li>
                <li><Link href="/first-3-chapters" className="hover:text-yellow-500 transition-colors">First 3 Chapters</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Programs</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/products" className="hover:text-yellow-500 transition-colors">Courses</Link></li>
                <li><Link href="/ai-coach" className="hover:text-yellow-500 transition-colors">AI Coach</Link></li>
                <li><Link href="/memoir" className="hover:text-yellow-500 transition-colors">The Memoir</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Connect</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-yellow-500 transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-yellow-500 transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-yellow-500 transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms-of-use" className="hover:text-yellow-500 transition-colors">Terms of Use</Link></li>
                <li><Link href="/refund-policy" className="hover:text-yellow-500 transition-colors">Refund Policy</Link></li>
                <li><Link href="/faqs" className="hover:text-yellow-500 transition-colors">FAQs</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-700 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Shaun Critzer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
