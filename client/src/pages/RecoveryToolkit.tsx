import { Navigation } from "@/components/Navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronDown, ChevronUp, Download, Calendar, Save, History } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface CheckIn {
  date: string;
  morning: {
    enoughSleep: boolean;
    physicallySafe: boolean;
    gratitude: string;
    recoveryAction: string;
    reachOutTo: string;
    intention: string;
  };
  evening: {
    staySober: boolean;
    wentWell: string;
    challenged: string;
    usedTools: boolean;
    gratefulFor: string;
    learned: string;
  };
}

export default function RecoveryToolkit() {
  const [hasAccess, setHasAccess] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  // Daily Check-In State
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
  const [morningCheckboxes, setMorningCheckboxes] = useState({
    enoughSleep: false,
    physicallySafe: false,
  });
  const [morningFields, setMorningFields] = useState({
    gratitude: "",
    recoveryAction: "",
    reachOutTo: "",
    intention: "",
  });
  const [eveningCheckboxes, setEveningCheckboxes] = useState({
    staySober: false,
    usedTools: false,
  });
  const [eveningFields, setEveningFields] = useState({
    wentWell: "",
    challenged: "",
    gratefulFor: "",
    learned: "",
  });

  // Trigger Identification State
  const [peopleTriggers, setPeopleTriggers] = useState(["", "", ""]);
  const [placeTriggers, setPlaceTriggers] = useState(["", "", ""]);
  const [emotionalTriggers, setEmotionalTriggers] = useState({
    anger: false,
    loneliness: false,
    stress: false,
    boredom: false,
    shame: false,
    fear: false,
    joy: false,
  });
  const [actionPlan, setActionPlan] = useState({
    people: "",
    places: "",
    emotions: "",
  });

  // Gratitude Practice State
  const [gratitudeDate, setGratitudeDate] = useState(new Date().toISOString().split('T')[0]);
  const [gratitudeItems, setGratitudeItems] = useState(["", "", ""]);
  const [gratitudePerson, setGratitudePerson] = useState("");
  const [gratitudeRecovery, setGratitudeRecovery] = useState("");

  // Amends Planning State
  const [amendsName, setAmendsName] = useState("");
  const [amendsHarm, setAmendsHarm] = useState("");
  const [amendsAffected, setAmendsAffected] = useState("");
  const [amendsWhatToSay, setAmendsWhatToSay] = useState("");

  // Inner Child Exercise State
  const [innerChildLetter, setInnerChildLetter] = useState("");
  const [innerChildPromise, setInnerChildPromise] = useState("");

  // Emergency Contact Card State
  const [emergencyContact, setEmergencyContact] = useState({
    sponsor: "",
    sponsorPhone: "",
    therapist: "",
    therapistPhone: "",
    accountabilityPartner: "",
    partnerPhone: "",
    sobrietyDate: "",
  });

  // Milestone Tracker State
  const [milestones, setMilestones] = useState([
    { milestone: "24 Hours", date: "", celebration: "", achieved: false },
    { milestone: "1 Week", date: "", celebration: "", achieved: false },
    { milestone: "30 Days", date: "", celebration: "", achieved: false },
    { milestone: "60 Days", date: "", celebration: "", achieved: false },
    { milestone: "90 Days", date: "", celebration: "", achieved: false },
    { milestone: "6 Months", date: "", celebration: "", achieved: false },
    { milestone: "1 Year", date: "", celebration: "", achieved: false },
    { milestone: "18 Months", date: "", celebration: "", achieved: false },
    { milestone: "2 Years", date: "", celebration: "", achieved: false },
    { milestone: "5 Years", date: "", celebration: "", achieved: false },
    { milestone: "10 Years", date: "", celebration: "", achieved: false },
  ]);

  const downloadMutation = trpc.leadMagnets.download.useMutation();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      await downloadMutation.mutateAsync({
        slug: "recovery-toolkit",
        email: email,
      });

      setHasAccess(true);
      toast.success("Access granted!", {
        description: "You've been added to our email list for weekly insights.",
      });
    } catch (error) {
      toast.error("Something went wrong", {
        description: "Please try again or contact support.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveCheckIn = () => {
    const checkIn: CheckIn = {
      date: checkInDate,
      morning: {
        ...morningCheckboxes,
        ...morningFields,
      },
      evening: {
        ...eveningCheckboxes,
        ...eveningFields,
      },
    };

    const saved = JSON.parse(localStorage.getItem('checkIns') || '[]');
    saved.push(checkIn);
    localStorage.setItem('checkIns', JSON.stringify(saved));
    toast.success("Check-in saved!");
  };

  const saveTriggerPlan = () => {
    localStorage.setItem('triggerPlan', JSON.stringify({
      peopleTriggers,
      placeTriggers,
      emotionalTriggers,
      actionPlan,
    }));
    toast.success("Trigger plan saved!");
  };

  const saveGratitudeEntry = () => {
    const entry = {
      date: gratitudeDate,
      items: gratitudeItems,
      person: gratitudePerson,
      recovery: gratitudeRecovery,
    };
    const saved = JSON.parse(localStorage.getItem('gratitudeEntries') || '[]');
    saved.push(entry);
    localStorage.setItem('gratitudeEntries', JSON.stringify(saved));
    toast.success("Gratitude entry saved!");
  };

  const saveAmendsDraft = () => {
    localStorage.setItem('amends', JSON.stringify({
      name: amendsName,
      harm: amendsHarm,
      affected: amendsAffected,
      whatToSay: amendsWhatToSay,
    }));
    toast.success("Amends draft saved!");
  };

  const saveInnerChildWork = () => {
    localStorage.setItem('innerChild', JSON.stringify({
      letter: innerChildLetter,
      promise: innerChildPromise,
    }));
    toast.success("Inner child work saved!");
  };

  const downloadEmergencyCard = () => {
    // Create a simple text representation for download
    const cardText = `EMERGENCY RECOVERY CONTACTS

Sponsor: ${emergencyContact.sponsor}
Phone: ${emergencyContact.sponsorPhone}

Therapist: ${emergencyContact.therapist}
Phone: ${emergencyContact.therapistPhone}

Accountability Partner: ${emergencyContact.accountabilityPartner}
Phone: ${emergencyContact.partnerPhone}

Crisis Hotline: 988
SAMHSA: 1-800-662-4357

My Sobriety Date: ${emergencyContact.sobrietyDate}

I am committed to my recovery. I will call someone before I use.`;

    const blob = new Blob([cardText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'emergency-recovery-card.txt';
    a.click();
    toast.success("Emergency card downloaded!");
  };

  const toggleSection = (index: number) => {
    setExpandedSection(expandedSection === index ? null : index);
  };

  const achievedMilestones = milestones.filter(m => m.achieved).length;
  const progressPercentage = (achievedMilestones / milestones.length) * 100;

  if (!hasAccess) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <section className="py-20 bg-gradient-to-b from-background to-accent/20">
          <div className="container max-w-2xl">
            <div className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold">
                The Recovery Toolkit
              </h1>
              <p className="text-xl text-muted-foreground">
                Practical Worksheets for Your Journey
              </p>
              <p className="text-muted-foreground">
                A collection of tools, exercises, and resources to support your recovery journey—whether you're in active addiction, early recovery, or supporting someone who is.
              </p>

              <Card className="p-8 mt-8">
                <h2 className="text-2xl font-bold mb-4">Access Required</h2>
                <p className="text-muted-foreground mb-6">
                  Enter your email to access interactive recovery worksheets and tools. You'll also receive weekly insights on recovery, trauma healing, and building a life worth staying sober for.
                </p>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Processing..." : "Get Access"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    No spam. Unsubscribe anytime. Your email is safe with me.
                  </p>
                </form>
              </Card>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-background to-accent/20">
        <div className="container max-w-5xl">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold">
              The Recovery Toolkit
            </h1>
            <p className="text-xl text-muted-foreground">
              Practical Worksheets for Your Journey
            </p>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Recovery isn't just about not drinking or using. It's about becoming whole. It's about processing trauma, building authentic relationships, and creating a life worth staying sober for. These aren't magic solutions—they're tools. And like any tool, they only work if you use them.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Sections */}
      <section className="py-20">
        <div className="container max-w-4xl">
          <div className="space-y-4">

            {/* Section 1: Daily Recovery Check-In */}
            <Card className="border-2 border-primary/20">
              <CardContent className="p-0">
                <button
                  onClick={() => toggleSection(1)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Daily Recovery Check-In</h3>
                      <p className="text-sm text-muted-foreground">Morning intentions & evening reflections</p>
                    </div>
                  </div>
                  {expandedSection === 1 ? <ChevronUp /> : <ChevronDown />}
                </button>

                {expandedSection === 1 && (
                  <div className="px-6 pb-6 space-y-6">
                    <p className="text-muted-foreground">
                      Use this every morning to set intentions and every evening to reflect.
                    </p>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Date</label>
                      <Input
                        type="date"
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                      />
                    </div>

                    {/* Morning Check-In */}
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                      <h4 className="font-bold text-lg mb-4">Morning Check-In</h4>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={morningCheckboxes.enoughSleep}
                            onChange={(e) => setMorningCheckboxes({...morningCheckboxes, enoughSleep: e.target.checked})}
                            className="w-4 h-4"
                          />
                          <label>Did I get enough sleep? (6-8 hours)</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={morningCheckboxes.physicallySafe}
                            onChange={(e) => setMorningCheckboxes({...morningCheckboxes, physicallySafe: e.target.checked})}
                            className="w-4 h-4"
                          />
                          <label>Am I physically safe today?</label>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">What am I grateful for right now?</label>
                          <Input
                            value={morningFields.gratitude}
                            onChange={(e) => setMorningFields({...morningFields, gratitude: e.target.value})}
                            placeholder="Enter your gratitude..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">What's one thing I can do today to support my recovery?</label>
                          <Input
                            value={morningFields.recoveryAction}
                            onChange={(e) => setMorningFields({...morningFields, recoveryAction: e.target.value})}
                            placeholder="Enter your recovery action..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">Who can I reach out to if I struggle today?</label>
                          <Input
                            value={morningFields.reachOutTo}
                            onChange={(e) => setMorningFields({...morningFields, reachOutTo: e.target.value})}
                            placeholder="Enter contact name..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">What's my intention for today?</label>
                          <Textarea
                            value={morningFields.intention}
                            onChange={(e) => setMorningFields({...morningFields, intention: e.target.value})}
                            placeholder="Enter your intention..."
                            className="min-h-[80px]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Evening Reflection */}
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <h4 className="font-bold text-lg mb-4">Evening Reflection</h4>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={eveningCheckboxes.staySober}
                            onChange={(e) => setEveningCheckboxes({...eveningCheckboxes, staySober: e.target.checked})}
                            className="w-4 h-4"
                          />
                          <label>Did I stay sober today?</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={eveningCheckboxes.usedTools}
                            onChange={(e) => setEveningCheckboxes({...eveningCheckboxes, usedTools: e.target.checked})}
                            className="w-4 h-4"
                          />
                          <label>Did I use my tools when I needed them?</label>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">What went well today?</label>
                          <Textarea
                            value={eveningFields.wentWell}
                            onChange={(e) => setEveningFields({...eveningFields, wentWell: e.target.value})}
                            placeholder="Reflect on what went well..."
                            className="min-h-[80px]"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">What challenged me today?</label>
                          <Textarea
                            value={eveningFields.challenged}
                            onChange={(e) => setEveningFields({...eveningFields, challenged: e.target.value})}
                            placeholder="Reflect on challenges..."
                            className="min-h-[80px]"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">What am I grateful for from today?</label>
                          <Input
                            value={eveningFields.gratefulFor}
                            onChange={(e) => setEveningFields({...eveningFields, gratefulFor: e.target.value})}
                            placeholder="Enter your gratitude..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">What's one thing I learned about myself today?</label>
                          <Textarea
                            value={eveningFields.learned}
                            onChange={(e) => setEveningFields({...eveningFields, learned: e.target.value})}
                            placeholder="Reflect on what you learned..."
                            className="min-h-[80px]"
                          />
                        </div>
                      </div>
                    </div>

                    <Button onClick={saveCheckIn} className="w-full">
                      <Save className="mr-2 h-4 w-4" />
                      Save Today's Check-In
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 2: Trigger Identification */}
            <Card className="border-2 border-primary/20">
              <CardContent className="p-0">
                <button
                  onClick={() => toggleSection(2)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
                      2
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Trigger Identification Worksheet</h3>
                      <p className="text-sm text-muted-foreground">Understand and manage your triggers</p>
                    </div>
                  </div>
                  {expandedSection === 2 ? <ChevronUp /> : <ChevronDown />}
                </button>

                {expandedSection === 2 && (
                  <div className="px-6 pb-6 space-y-6">
                    <p className="text-muted-foreground">
                      Understanding your triggers is the first step to managing them.
                    </p>

                    {/* People Triggers */}
                    <div>
                      <h4 className="font-bold mb-3">People Triggers</h4>
                      <p className="text-sm text-muted-foreground mb-3">Who are the people that trigger cravings or negative emotions?</p>
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

                    {/* Place Triggers */}
                    <div>
                      <h4 className="font-bold mb-3">Place Triggers</h4>
                      <p className="text-sm text-muted-foreground mb-3">What locations trigger cravings or negative emotions?</p>
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

                    {/* Emotional Triggers */}
                    <div>
                      <h4 className="font-bold mb-3">Emotional Triggers</h4>
                      <p className="text-sm text-muted-foreground mb-3">What emotions make you want to use or engage in old behaviors?</p>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(emotionalTriggers).map(([key, value]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => setEmotionalTriggers({...emotionalTriggers, [key]: e.target.checked})}
                              className="w-4 h-4"
                            />
                            <label className="capitalize">{key}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Plan */}
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                      <h4 className="font-bold mb-3">Your Action Plan</h4>
                      <p className="text-sm text-muted-foreground mb-3">For each trigger category, write one healthy coping strategy:</p>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2">When triggered by people:</label>
                          <Textarea
                            value={actionPlan.people}
                            onChange={(e) => setActionPlan({...actionPlan, people: e.target.value})}
                            placeholder="Your coping strategy..."
                            className="min-h-[60px]"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">When triggered by places:</label>
                          <Textarea
                            value={actionPlan.places}
                            onChange={(e) => setActionPlan({...actionPlan, places: e.target.value})}
                            placeholder="Your coping strategy..."
                            className="min-h-[60px]"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">When triggered by emotions:</label>
                          <Textarea
                            value={actionPlan.emotions}
                            onChange={(e) => setActionPlan({...actionPlan, emotions: e.target.value})}
                            placeholder="Your coping strategy..."
                            className="min-h-[60px]"
                          />
                        </div>
                      </div>
                    </div>

                    <Button onClick={saveTriggerPlan} className="w-full">
                      <Save className="mr-2 h-4 w-4" />
                      Save My Trigger Plan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 3: Gratitude Practice */}
            <Card className="border-2 border-primary/20">
              <CardContent className="p-0">
                <button
                  onClick={() => toggleSection(3)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
                      3
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Gratitude Practice Template</h3>
                      <p className="text-sm text-muted-foreground">Rewire your brain for positivity</p>
                    </div>
                  </div>
                  {expandedSection === 3 ? <ChevronUp /> : <ChevronDown />}
                </button>

                {expandedSection === 3 && (
                  <div className="px-6 pb-6 space-y-6">
                    <p className="text-muted-foreground">
                      Research shows gratitude rewires the brain for positivity and resilience.
                    </p>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Today's Date</label>
                      <Input
                        type="date"
                        value={gratitudeDate}
                        onChange={(e) => setGratitudeDate(e.target.value)}
                      />
                    </div>

                    <div>
                      <h4 className="font-bold mb-3">Three things I'm grateful for today:</h4>
                      {gratitudeItems.map((item, idx) => (
                        <Input
                          key={idx}
                          value={item}
                          onChange={(e) => {
                            const updated = [...gratitudeItems];
                            updated[idx] = e.target.value;
                            setGratitudeItems(updated);
                          }}
                          placeholder={`Gratitude ${idx + 1}`}
                          className="mb-2"
                        />
                      ))}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">One person I'm grateful for and why:</label>
                      <Textarea
                        value={gratitudePerson}
                        onChange={(e) => setGratitudePerson(e.target.value)}
                        placeholder="Describe the person and why you're grateful..."
                        className="min-h-[80px]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">One thing about my recovery I'm grateful for:</label>
                      <Textarea
                        value={gratitudeRecovery}
                        onChange={(e) => setGratitudeRecovery(e.target.value)}
                        placeholder="Reflect on your recovery journey..."
                        className="min-h-[80px]"
                      />
                    </div>

                    <Button onClick={saveGratitudeEntry} className="w-full">
                      <Save className="mr-2 h-4 w-4" />
                      Save Entry
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 4: Amends Planning Guide */}
            <Card className="border-2 border-primary/20">
              <CardContent className="p-0">
                <button
                  onClick={() => toggleSection(4)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
                      4
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Amends Planning Guide</h3>
                      <p className="text-sm text-muted-foreground">Plan amends with care and wisdom</p>
                    </div>
                  </div>
                  {expandedSection === 4 ? <ChevronUp /> : <ChevronDown />}
                </button>

                {expandedSection === 4 && (
                  <div className="px-6 pb-6 space-y-6">
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                      <h4 className="font-bold text-red-900 mb-2">Important Notes Before You Begin:</h4>
                      <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                        <li>Not all amends require direct contact</li>
                        <li>Some amends would cause more harm than good</li>
                        <li>Timing matters—don't rush this process</li>
                        <li>Work with a sponsor or therapist on this</li>
                      </ul>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Person I Want to Make Amends To:</label>
                      <Input
                        value={amendsName}
                        onChange={(e) => setAmendsName(e.target.value)}
                        placeholder="Enter name..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">What I Did That Caused Harm:</label>
                      <Textarea
                        value={amendsHarm}
                        onChange={(e) => setAmendsHarm(e.target.value)}
                        placeholder="Describe what happened..."
                        className="min-h-[100px]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">How It Affected Them:</label>
                      <Textarea
                        value={amendsAffected}
                        onChange={(e) => setAmendsAffected(e.target.value)}
                        placeholder="Reflect on the impact..."
                        className="min-h-[100px]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">What I Want to Say (Draft):</label>
                      <Textarea
                        value={amendsWhatToSay}
                        onChange={(e) => setAmendsWhatToSay(e.target.value)}
                        placeholder="Draft your amends..."
                        className="min-h-[120px]"
                      />
                    </div>

                    <Button onClick={saveAmendsDraft} className="w-full">
                      <Save className="mr-2 h-4 w-4" />
                      Save Draft
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 5: Inner Child Healing */}
            <Card className="border-2 border-primary/20">
              <CardContent className="p-0">
                <button
                  onClick={() => toggleSection(5)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
                      5
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Inner Child Healing Exercise</h3>
                      <p className="text-sm text-muted-foreground">Connect with your younger self</p>
                    </div>
                  </div>
                  {expandedSection === 5 ? <ChevronUp /> : <ChevronDown />}
                </button>

                {expandedSection === 5 && (
                  <div className="px-6 pb-6 space-y-6">
                    <p className="text-muted-foreground">
                      Much of our addiction stems from childhood wounds. This exercise helps you connect with and heal your inner child.
                    </p>

                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                        <h4 className="font-bold mb-2">Step 1: Find a Quiet Space</h4>
                        <p className="text-sm">Set aside 15-20 minutes where you won't be interrupted.</p>
                      </div>

                      <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                        <h4 className="font-bold mb-2">Step 2: Visualize Your Younger Self</h4>
                        <p className="text-sm">Close your eyes. Picture yourself as a child—whatever age feels right. What are you wearing? Where are you? What do you look like?</p>
                      </div>

                      <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                        <h4 className="font-bold mb-2">Step 3: Ask Questions</h4>
                        <p className="text-sm">Imagine sitting down with this younger version of yourself. Ask:</p>
                        <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
                          <li>What do you need right now?</li>
                          <li>What are you afraid of?</li>
                          <li>What do you want me to know?</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-bold mb-2">Step 4: Offer Comfort</h4>
                        <label className="block text-sm text-muted-foreground mb-2">What does your inner child need to hear? Write it here:</label>
                        <Textarea
                          value={innerChildLetter}
                          onChange={(e) => setInnerChildLetter(e.target.value)}
                          placeholder="Dear younger me,&#10;&#10;"
                          className="min-h-[150px]"
                        />
                      </div>

                      <div>
                        <h4 className="font-bold mb-2">Step 5: Make a Promise</h4>
                        <label className="block text-sm text-muted-foreground mb-2">What can you promise your inner child?</label>
                        <Textarea
                          value={innerChildPromise}
                          onChange={(e) => setInnerChildPromise(e.target.value)}
                          placeholder="My promise:"
                          className="min-h-[80px]"
                        />
                      </div>
                    </div>

                    <Button onClick={saveInnerChildWork} className="w-full">
                      <Save className="mr-2 h-4 w-4" />
                      Save My Inner Child Work
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 6: Emergency Contact Card */}
            <Card className="border-2 border-primary/20">
              <CardContent className="p-0">
                <button
                  onClick={() => toggleSection(6)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
                      6
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Emergency Contact Card</h3>
                      <p className="text-sm text-muted-foreground">Keep crisis contacts handy</p>
                    </div>
                  </div>
                  {expandedSection === 6 ? <ChevronUp /> : <ChevronDown />}
                </button>

                {expandedSection === 6 && (
                  <div className="px-6 pb-6 space-y-6">
                    <p className="text-muted-foreground">
                      Fill out this card and download it to keep in your wallet or on your phone.
                    </p>

                    <div className="p-6 rounded-lg border-2 border-primary bg-card">
                      <h4 className="font-bold text-center mb-6 text-xl">EMERGENCY RECOVERY CONTACTS</h4>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold mb-1">Sponsor:</label>
                            <Input
                              value={emergencyContact.sponsor}
                              onChange={(e) => setEmergencyContact({...emergencyContact, sponsor: e.target.value})}
                              placeholder="Name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold mb-1">Phone:</label>
                            <Input
                              value={emergencyContact.sponsorPhone}
                              onChange={(e) => setEmergencyContact({...emergencyContact, sponsorPhone: e.target.value})}
                              placeholder="Phone number"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold mb-1">Therapist:</label>
                            <Input
                              value={emergencyContact.therapist}
                              onChange={(e) => setEmergencyContact({...emergencyContact, therapist: e.target.value})}
                              placeholder="Name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold mb-1">Phone:</label>
                            <Input
                              value={emergencyContact.therapistPhone}
                              onChange={(e) => setEmergencyContact({...emergencyContact, therapistPhone: e.target.value})}
                              placeholder="Phone number"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold mb-1">Accountability Partner:</label>
                            <Input
                              value={emergencyContact.accountabilityPartner}
                              onChange={(e) => setEmergencyContact({...emergencyContact, accountabilityPartner: e.target.value})}
                              placeholder="Name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold mb-1">Phone:</label>
                            <Input
                              value={emergencyContact.partnerPhone}
                              onChange={(e) => setEmergencyContact({...emergencyContact, partnerPhone: e.target.value})}
                              placeholder="Phone number"
                            />
                          </div>
                        </div>

                        <div className="pt-4 border-t">
                          <p className="font-semibold">Crisis Hotline: <span className="font-bold text-primary">988</span></p>
                          <p className="font-semibold">SAMHSA: <span className="font-bold text-primary">1-800-662-4357</span></p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-1">My Sobriety Date:</label>
                          <Input
                            type="date"
                            value={emergencyContact.sobrietyDate}
                            onChange={(e) => setEmergencyContact({...emergencyContact, sobrietyDate: e.target.value})}
                          />
                        </div>

                        <div className="pt-4 border-t text-center">
                          <p className="font-semibold">I am committed to my recovery.</p>
                          <p className="font-semibold">I will call someone before I use.</p>
                        </div>
                      </div>
                    </div>

                    <Button onClick={downloadEmergencyCard} className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Download as Text File
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 7: Recovery Milestone Tracker */}
            <Card className="border-2 border-primary/20">
              <CardContent className="p-0">
                <button
                  onClick={() => toggleSection(7)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
                      7
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Recovery Milestone Tracker</h3>
                      <p className="text-sm text-muted-foreground">Celebrate your progress—every day counts</p>
                    </div>
                  </div>
                  {expandedSection === 7 ? <ChevronUp /> : <ChevronDown />}
                </button>

                {expandedSection === 7 && (
                  <div className="px-6 pb-6 space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold">Progress: {achievedMilestones} / {milestones.length} milestones</span>
                        <span className="text-sm text-muted-foreground">{progressPercentage.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-primary h-3 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      {milestones.map((milestone, idx) => (
                        <div key={idx} className={`p-4 rounded-lg border-2 ${milestone.achieved ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={milestone.achieved}
                                onChange={(e) => {
                                  const updated = [...milestones];
                                  updated[idx].achieved = e.target.checked;
                                  setMilestones(updated);
                                }}
                                className="w-5 h-5"
                              />
                              <span className="font-bold">{milestone.milestone}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 ml-8">
                            <div>
                              <label className="block text-xs font-semibold mb-1">Date Achieved:</label>
                              <Input
                                type="date"
                                value={milestone.date}
                                onChange={(e) => {
                                  const updated = [...milestones];
                                  updated[idx].date = e.target.value;
                                  setMilestones(updated);
                                }}
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold mb-1">How I Celebrated:</label>
                              <Input
                                value={milestone.celebration}
                                onChange={(e) => {
                                  const updated = [...milestones];
                                  updated[idx].celebration = e.target.value;
                                  setMilestones(updated);
                                }}
                                placeholder="Celebration..."
                                className="text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 8: Additional Resources */}
            <Card className="border-2 border-primary/20">
              <CardContent className="p-0">
                <button
                  onClick={() => toggleSection(8)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
                      8
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Additional Resources</h3>
                      <p className="text-sm text-muted-foreground">Books, therapy, and support groups</p>
                    </div>
                  </div>
                  {expandedSection === 8 ? <ChevronUp /> : <ChevronDown />}
                </button>

                {expandedSection === 8 && (
                  <div className="px-6 pb-6 space-y-6">
                    <div>
                      <h4 className="font-bold text-lg mb-3">Books That Helped Me:</h4>
                      <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                        <li>The Body Keeps the Score by Bessel van der Kolk</li>
                        <li>Alcoholics Anonymous (The Big Book)</li>
                        <li>Twelve Steps and Twelve Traditions</li>
                        <li>Getting Past Your Past by Francine Shapiro (EMDR)</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-lg mb-3">Therapy Modalities That Work:</h4>
                      <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                        <li>EMDR (Eye Movement Desensitization and Reprocessing)</li>
                        <li>CBT (Cognitive Behavioral Therapy)</li>
                        <li>Trauma-Focused Therapy</li>
                        <li>Group Therapy</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-lg mb-3">Support Groups:</h4>
                      <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                        <li>Alcoholics Anonymous (AA)</li>
                        <li>Narcotics Anonymous (NA)</li>
                        <li>SMART Recovery</li>
                        <li>Celebrate Recovery</li>
                      </ul>
                    </div>

                    <div className="p-6 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20">
                      <h4 className="font-bold text-xl mb-4">Final Thoughts</h4>
                      <p className="mb-4">Recovery is possible. I'm living proof.</p>
                      <p className="mb-4">Thirteen years ago, I was in psych wards, facing protective orders, losing my kids, and wanting to die. Today, I have a life beyond my wildest dreams—not because I'm special, but because I did the work.</p>
                      <p className="mb-4">You can too.</p>
                      <p className="font-bold">One day at a time.</p>
                      <p className="text-right mt-4">— Shaun Critzer</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-card">
        <div className="container">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Shaun Critzer</h3>
              <p className="text-sm text-muted-foreground">
                Author, speaker, and recovery advocate. 13 years sober and helping others find hope in their own journey.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">The Memoir</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/memoir" className="hover:text-primary transition-colors">About the Book</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/resources" className="hover:text-primary transition-colors">Free Downloads</a></li>
                <li><a href="/products" className="hover:text-primary transition-colors">Products</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Connect</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/about" className="hover:text-primary transition-colors">About</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/terms-of-use" className="hover:text-primary transition-colors">Terms of Use</a></li>
                <li><a href="/refund-policy" className="hover:text-primary transition-colors">Refund Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Shaun Critzer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
