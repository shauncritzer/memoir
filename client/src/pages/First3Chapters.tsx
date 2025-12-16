import { Navigation } from "@/components/Navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Download, BookOpen, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

export default function First3Chapters() {
  const [hasAccess, setHasAccess] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const downloadMutation = trpc.leadMagnets.download.useMutation();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      await downloadMutation.mutateAsync({
        slug: "first-3-chapters",
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

  if (!hasAccess) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <section className="py-20 bg-gradient-to-b from-background to-accent/20">
          <div className="container max-w-2xl">
            <div className="text-center space-y-6">
              <div className="w-32 h-32 mx-auto rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <BookOpen className="h-16 w-16 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold">
                First 3 Chapters
              </h1>
              <p className="text-xl text-muted-foreground">
                Free Excerpt from Crooked Lines: Bent, Not Broken
              </p>
              <p className="text-muted-foreground">
                Thank you for your interest in reading the first three chapters of <em>Crooked Lines: Bent, Not Broken</em>. This memoir chronicles my journey through childhood trauma, addiction, rock bottom, and the redemption that comes from choosing recovery one day at a time.
              </p>
              <p className="text-muted-foreground">
                What you're about to read is raw, unflinching, and honest. If you're struggling with addiction, trauma, or the crushing weight of being human—this book is for you.
              </p>
              <p className="font-bold text-lg">
                You are not alone, and you are not too far gone.
              </p>

              <Card className="p-8 mt-8">
                <h2 className="text-2xl font-bold mb-4">Access Required</h2>
                <p className="text-muted-foreground mb-6">
                  Enter your email to read the first three chapters online. You'll also receive updates about the full book release and exclusive recovery resources.
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
                    {isSubmitting ? "Processing..." : "Read the Excerpt"}
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
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-b from-background to-accent/20 border-b">
        <div className="container max-w-4xl">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              Crooked Lines
            </h1>
            <p className="text-2xl text-muted-foreground font-serif italic">
              Bent, Not Broken
            </p>
            <p className="text-lg">
              A Memoir by Shaun Critzer
            </p>
          </div>
        </div>
      </section>

      {/* Content Warning */}
      <section className="py-8 bg-red-50 border-y border-red-200">
        <div className="container max-w-3xl">
          <div className="flex gap-4 items-start">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-red-900 mb-2">Content Warning</h2>
              <p className="text-red-800">
                This excerpt contains frank discussions of childhood sexual abuse, substance abuse, and mental health crises. If you need support, please see the resources at the end of this document.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <article className="py-16">
        <div className="container max-w-3xl">
          <div className="prose prose-lg max-w-none space-y-8">

            {/* Prologue */}
            <section className="space-y-6">
              <h2 className="text-3xl font-bold border-b pb-4">PROLOGUE: The Liquor Store Parking Lot</h2>

              <p>
                The ABC store sits less than a mile from the Thursday night meeting, its neon sign flickering like a bad conscience in the twilight. I'm parked outside, engine off, hands gripping the steering wheel, keeping me tethered to earth.
              </p>

              <p>
                Eighteen months sober. Eighteen months of white-knuckling through meetings, forcing myself to say the words, showing up when every cell in my body screamed to run. Eighteen months of people telling me it gets better, that I just need to work the program, that God has a plan.
              </p>

              <p>
                But I'm not better. I'm worse.
              </p>

              <p>
                The protective order has been in place for over a year now. I can't go home—the home my parents sold to me and Jennie, the home where my kids sleep, the home I destroyed with my own hands. I'm living in Landon's room at my parents' house like I'm fifteen again, except I'm thirty-four and I've lost everything that ever mattered.
              </p>

              <p>
                Jennie won't look at me during custody exchanges. My mom has to play mediator, passing messages like we're children, because the court says I can't be within two hundred feet of my own wife. When the kids come to visit, I have to leave my parents' house and drive around the neighborhood, wait at the cul-de-sac like a criminal until Jennie's car disappears down the street.
              </p>

              <p>
                The meeting starts in twenty minutes. Shannon will be there—the gorgeous woman I've been building up courage to talk to for months, the one whose laugh lights up the entire room, the one I dream about even though I know I'm in no shape to deserve anyone's attention. She gave me a hug last week after I shared about how hard things were. It was the first time in months anyone had touched me with kindness.
              </p>

              <p>
                But I can't seem to make my feet move toward the meeting.
              </p>

              <p>
                Instead, I'm here. At the ABC store. Where I used to come every single day of the week when I was drinking. Where I'd buy my fifths and half-gallons of Jim Beam the way other people buy milk. Where the employees knew my name and probably took bets on how long until I'd kill myself or someone else.
              </p>

              <p>
                I don't remember deciding to come here. One minute I was driving toward the meeting, the next minute I was sitting in this parking lot, and I couldn't tell you how I got from Point A to Point B. My feet just... brought me here. Without permission. Without conscious thought.
              </p>

              <p>
                The bodybuilder and alcoholic in me knows what this is. Muscle memory. Autopilot. The obsession takes you to the places your disease wants you to go. And once you're there, your body knows exactly what to do. No conscious thought required. Just practiced repetition. Just the invisible hand of addiction steering the wheel while muscle memory executes the plan.
              </p>

              <p className="italic">
                Walk through those doors. Find the bourbon aisle. Reach for the Jim Beam. Take it to the register. I've done this a thousand times before. My body remembers every step.
              </p>

              <p>
                I turn off the ignition.
              </p>

              <p>
                My hands are shaking—not from withdrawal this time, but from anticipation. From desire. From the thing that lives in my chest that whispers <em>just one drink, just one drink, just one drink</em> like a mantra, like a prayer, like a promise that this time will be different.
              </p>

              <p>
                I get out of the car.
              </p>

              <p>
                The parking lot asphalt is cracked, weeds pushing through. My legs feel disconnected from my body as I walk toward the entrance. This is not me making a decision. This is me watching myself make a decision, powerless to stop it, like I'm floating three feet behind my own head.
              </p>

              <p>
                The automatic doors slide open with a pneumatic hiss.
              </p>

              <p>And I'm inside.</p>

              <p>
                The fluorescent lights are too bright, humming with that particular frequency that feels like it's vibrating inside your skull. The aisles stretch out before me in neat rows—airplane bottles on the left, vodka and other clear liquors straight ahead, and my bourbon aisle on the far right wall.
              </p>

              <p>I can still see the store in my mind 13 years later, still smell it.</p>

              <p>My liquor. My poison. My medicine. My god.</p>

              <p>
                I drift toward the bourbon aisle, my stomach churning. Not sure if that's excitement, fear, or death's door calling me home.
              </p>

              <p>
                There they are. The bottles. Hundreds of them, glass soldiers standing at attention, waiting for me. Jim Beam. Maker's Mark. Wild Turkey. Woodford Reserve. Each one a memory. Each one a blackout. Each one a promise that for just a few hours, I won't have to feel this crushing weight of being alive and awake and aware of everything I've destroyed.
              </p>

              <p>My vision blurs.</p>

              <p>I blink, and realize I'm crying.</p>

              <p>
                Standing in the middle of the ABC store on a Thursday evening, tears running down my face, staring at bottles of bourbon like they're old lovers who betrayed me. Or maybe I betrayed them. I can't remember anymore.
              </p>

              <p>
                An older couple walks past, gives me a wide berth. The woman whispers something to her husband. They speed up their pace toward the wine section.
              </p>

              <p>
                I don't blame them. If you're ever in a liquor store and you see someone crying while looking at bottles of whiskey, you're witnessing something abnormal. That's not how normal people drink. Normal people don't cry in liquor stores. Normal people don't have relationships with alcohol that end in tears.
              </p>

              <p>Normal people can take it or leave it.</p>

              <p>
                I reach out and touch a bottle of Jim Beam. The glass is cool against my palm, smooth, familiar. I could buy this bottle right now. I have money in my wallet. I'm an adult. I'm allowed. Who's going to stop me?
              </p>

              <p>
                In my mind, I can already taste it. Feel the burn sliding down my throat, the warmth spreading through my chest, the blessed numbness starting in my fingers and toes and working its way inward until everything—the protective order, the lost kids, the shame, the rage, the fear—all of it just... softens. Blurs. Disappears.
              </p>

              <p>
                Just for tonight. Just to take the edge off. Just to make it through one more day in this hell I've created.
              </p>

              <p>My hand tightens around the bottle neck.</p>

              <p>
                And then I hear it. Not a voice, exactly. More like a whisper underneath thought. The same whisper that's been trying to get through to me for eighteen months, the one I've been drowning out with anger and resentment and self-pity.
              </p>

              <p className="italic">This won't fix anything.</p>

              <p>
                I know that. Of course I know that. I've known that since I was thirty-two years old, since the first DUI where I blew a .31 and thought my life was over. I've known it through every psych ward admission, every weekend in jail, every morning waking up and not remembering how I got home. I've known it through watching my best friend Strauss fall from a balcony and never walk again. Through Ricky dying of a heart attack at twenty-nine. Through holding my newborn son and thinking I was being punished by God for every terrible thing I'd ever done.
              </p>

              <p>I've known it. But knowing hasn't been enough.</p>

              <p>My hand releases the bottle.</p>

              <p>I step back from the shelf like it's on fire.</p>

              <p>
                And then I'm moving—not toward the register, but toward the exit. Fast. My feet carrying me somewhere different this time, somewhere my disease doesn't want me to go but something else inside me does.
              </p>

              <p>
                The automatic doors open and I'm gulping night air, stumbling toward my car, hands fumbling for keys. I drive. Not home—I don't have a home. But to the place that's been waiting for me. The place I should have gone first.
              </p>

              <div className="my-8 border-t border-b py-4">
                <p className="text-center text-muted-foreground">• • •</p>
              </div>

              <p>
                Seven minutes later, I pull into the parking lot of the Thursday night meeting on Pantops mountain. The same building that houses the IOP program where I first started getting help. I'm ten minutes late, but the door is unlocked.
              </p>

              <p>
                I can hear them inside, voices raised in unison: <em>"God, grant me the serenity to accept the things I cannot change..."</em>
              </p>

              <p>
                I slip into the back row, and I'm still crying. Tears streaming down my face, shoulders shaking, trying to breathe and failing.
              </p>

              <p>
                The guy next to me—an old-timer with maybe thirty years sober—slides a box of tissues my way without a word. Doesn't ask what's wrong. Doesn't need to. He's probably sat exactly where I'm sitting.
              </p>

              <p>When they ask if anyone wants to share, my hand goes up before my brain can stop it.</p>

              <p>"My name is Shaun, and I'm an alcoholic."</p>

              <p>"Hi, Shaun," they say back, and it sounds like home.</p>

              <p>
                "I—" My voice cracks. "I just came from the ABC store. I was standing there, holding a bottle, and I... I don't know what happened, but I'm here instead."
              </p>

              <p>The room is silent except for the sound of my breathing.</p>

              <p>
                "I'm eighteen months sober and I feel like I'm dying. I lost my kids, my house, my marriage. I'm living with my parents. I can't go five minutes without thinking about drinking. And I don't understand why people keep saying this gets better because it doesn't feel better. It feels like hell."
              </p>

              <p>More silence. Then the old-timer next to me shared his experience.</p>

              <p>
                "For me, It got better when I stopped fighting it," he says. "When I stopped trying to force it, control it, manage it. When I finally—<em>finally</em>—just surrendered and did the work."
              </p>

              <p>
                After the meeting, Shannon finds me by my car. The woman with the piercing eyes and the laugh that sounds like hope. She doesn't say anything at first. Just wraps me in a hug, and I let myself be held for the first time in what feels like years.
              </p>

              <p>"You okay?" she asks when she pulls back.</p>

              <p>"No," I say honestly. "But I'm here. I didn't drink. That's something, right?"</p>

              <p>"That's everything," she says.</p>

              <div className="my-8 border-t border-b py-4">
                <p className="text-center text-muted-foreground">• • •</p>
              </div>

              <p>
                I drive back to my parents' house that night. Back to Landon's room with the wooden bed frame and the smell of my failure hanging in the air. But something is different.
              </p>

              <p>
                I walked into a liquor store and cried over bourbon bottles like a crazy person. I stood there, an alcoholic in the lion's den, and somehow—<em>somehow</em>—I walked out empty-handed.
              </p>

              <div className="p-6 bg-accent/20 rounded-lg border-l-4 border-primary my-8">
                <p className="font-semibold">
                  That was my bottom in sobriety. Not the psych wards. Not the protective order. Not even losing access to my kids. It was standing in that ABC store, crying, finally understanding that no amount of discipline, no amount of white-knuckling, no amount of showing up to meetings would save me if I didn't actually surrender.
                </p>
                <p className="mt-4">
                  I didn't know it then, but that night—in early 2015—that was the night I finally put both feet in.
                </p>
                <p className="mt-2">
                  That was the night I chose the meeting instead of the bottle.
                </p>
                <p className="mt-2 font-bold">
                  That was the night everything started to change.
                </p>
              </div>
            </section>

            <div className="border-t border-b py-8 my-12">
              <h2 className="text-2xl font-bold text-center">PART I: FOUNDATIONS & FRACTURES</h2>
              <p className="text-center text-muted-foreground italic mt-2">The wounds beneath the armor</p>
            </div>

            {/* Chapter 1 */}
            <section className="space-y-6">
              <h2 className="text-3xl font-bold border-b pb-4">Chapter 1: The Oxygen Tent</h2>

              <p>
                I remember the rain—JCPenney parking lot, my parents' voices blending with windshield wipers, and words I didn't understand: pneumonia, whooping cough, admission.
              </p>

              <p>
                I was four years old, and the world was about to shrink to the size of a clear dome.
              </p>

              <p>
                Martha Jefferson Hospital. The same hospital where I was born. My mom gripped my hand as we walked through automatic doors that hissed open like they were exhaling. Everything smelled like antiseptic and fear. There were other kids crying somewhere down the hall, and the sound made my stomach hurt.
              </p>

              <p>
                The nurses were nice—too nice, the way adults get when something bad is happening and they're trying to make it seem okay. They led us to a room, and that's when I saw it through the doorway: the oxygen tent.
              </p>

              <p>
                It looked like something from a science fiction movie. A clear plastic dome that would go over the hospital bed, sealing you inside. I'd seen something like it before—in E.T., when Elliott and E.T. both got sick and the government put them in those plastic tents to study them. In the movie, it meant you were very, very sick. It meant you were separate from everyone else. It meant they didn't know if you'd make it.
              </p>

              <p>
                "It's going to help you breathe better, honey," Mom said, but her voice was doing that thing where it went up at the end, like she was asking a question instead of making a statement.
              </p>

              <p>
                I didn't want to get in the tent.
              </p>

              <p>
                But when you're four, you don't get to choose. The nurses helped me onto the bed, and then the plastic came down around me with a soft whoosh of air. One of the nurses tried to cheer me up, said it would be like having my own little fort. But I knew forts were meant to keep people out.
              </p>

              <p>This felt different. Like something meant to keep me in.</p>

              <p>
                My own homemade prison of plastic and air. I could see out—see my mom's face, see the fluorescent lights, see the door to my room—but everything looked distorted, wavy, like I was underwater.
              </p>

              <p>
                I couldn't touch anything. Couldn't hug my mom. Couldn't hold my dad's hand. I was the boy in the bubble. Separate. Different. Alone.
              </p>

              <p>
                The first night was the worst. Mom slept in a chair next to my bed, and I could see her there, just a few feet away, but it might as well have been miles. When I got scared and started to cry, she pressed her hand against the plastic, and I pressed mine on the other side, but we couldn't actually touch. Our hands were separated by millimeters of plastic that felt like an ocean.
              </p>

              <p>That's when my dad showed up with the slippers.</p>

              <p>
                Dad wasn't the emotional one. He never was. His favorite saying was "Go ask your mom," and that's what happened with just about everything—permission for things, questions about girls, conversations about life. He and I had a good relationship, but we didn't talk about the heavier side of life. Not really. He'd come home from work, we'd eat dinner together as a family, but he was a man of few words. Still is.
              </p>

              <p>But that second day in the hospital, Dad brought me two pairs of slippers.</p>

              <p>
                The first pair was Cookie Monster. Big, fuzzy, bright blue, with Cookie Monster's face on the toes. They were soft and silly and exactly the kind of thing a scared four-year-old would love. When you're that age and you're scared, Cookie Monster represents everything good in the world—fun, laughter, innocence, cookies.
              </p>

              <p>
                The second pair was G.I. Joe. Army green, tough-looking, with little plastic soldiers on the sides. These weren't soft and fuzzy. These were hard, military, serious. When you're four and you put on G.I. Joe slippers, you're not a scared little boy in a hospital. You're a soldier. You're brave. You're strong.
              </p>

              <p>
                Dad didn't explain why he brought two pairs. He just set them both at the foot of my bed, inside the tent where I could reach them, and said, "Thought you might like these, buddy."
              </p>

              <p>And then he left. Because that's what Dad did—showed his love through actions, not words.</p>

              <p>
                I didn't understand it then, sitting in that oxygen tent with pneumonia and whooping cough threatening to drown my lungs. I didn't understand that my father had just given me a roadmap for survival. A way to navigate being four years old and terrified and separate from everyone else.
              </p>

              <p>But I understand it now.</p>

              <p>Those two pairs of slippers were my first lesson in becoming two different people.</p>

              <p>
                Cookie Monster was the fun-loving, sweet, innocent, carefree version of me. The version that laughed and played and didn't take life too seriously. The version that people wanted to be around, that made friends easily, that fit in.
              </p>

              <p>
                G.I. Joe was the tough, brave face I'd have to put on when things got hard. The armor. The soldier who could endure anything, who didn't cry, who didn't show weakness. The version that could survive.
              </p>

              <p>
                And from that moment forward, I was always deciding: Which slippers do I wear today? Cookie Monster or G.I. Joe? Which version of myself do I need to be to make it through?
              </p>

              <div className="my-8 border-t border-b py-4">
                <p className="text-center text-muted-foreground">• • •</p>
              </div>

              <p>
                I stayed in that tent for three days. Maybe four. Time gets fuzzy when you're that age and that sick. I remember the nurses checking my vitals through arm-holes in the plastic. I remember my mom reading to me, her voice muffled through the barrier. I remember watching TV through the distortion and thinking how strange everything looked.
              </p>

              <p>But mostly I remember the feeling of being separate.</p>

              <p>
                Not just physically separate—though that was real enough, trapped under plastic while the world continued outside my bubble. But something deeper than that. A sense that I was fundamentally different from other people. That there was me, and there was everyone else, and there was this invisible barrier between us that I couldn't quite cross.
              </p>

              <p>
                My therapist at The Ranch, years later, would have a term for it: dissociation. The beginning of learning to split yourself into different versions, different personalities, different masks you wear to survive. The origin story of the chameleon I'd become.
              </p>

              <p>
                But at four, I just knew that something had shifted. Before the oxygen tent, I was just a kid. After the oxygen tent, I was a kid who understood isolation. Who understood that sometimes you're on your own, even when people who love you are right there. Who understood that the world isn't always safe, and your body can betray you, and sometimes you have to just endure until it's over.
              </p>

              <p>
                When they finally lifted the tent and told me I could go home, I remember Mom crying—the good kind of crying, the relief kind. I remember Dad carrying me to the car. I remember clutching those slippers, one pair in each hand, not wanting to leave them behind.
              </p>

              <p>"Which ones do you want to wear?" Mom asked as Dad settled me into the backseat.</p>

              <p>
                I looked down at them. Cookie Monster grinning up at me, all goofy and innocent. G.I. Joe staring forward, ready for battle.
              </p>

              <p>"Can I keep both?" I asked.</p>

              <p>"Of course, honey."</p>

              <p>
                And I did. I kept both. Because even at four, some part of me understood: I was going to need them both to make it through this life.
              </p>

              <div className="p-6 bg-accent/20 rounded-lg border-l-4 border-primary my-8">
                <p className="font-semibold">
                  The oxygen tent was my first real memory of feeling different. Separate. Like I existed slightly outside of normal reality, watching through plastic while everyone else lived in the real world.
                </p>
                <p className="mt-4">
                  It wouldn't be my last.
                </p>
                <p className="mt-2">
                  But it was the beginning of understanding that I could adapt. That I could be whatever I needed to be in any given moment—fun Shaun, tough Shaun, sweet Shaun, soldier Shaun. All I had to do was figure out which version the situation required, and I could slip into that role as easily as putting on a pair of slippers.
                </p>
              </div>
            </section>

            {/* Chapter 2 */}
            <section className="space-y-6">
              <h2 className="text-3xl font-bold border-b pb-4">Chapter 2: The Caged Animal In Me</h2>

              <p>
                The Cage—that's what they called it. The aquatic center in the basement of U Hall, where Ralph Sampson once played basketball for UVA. Back then it was just a name, but years later, I'd understand what it meant to live like an animal trapped inside one—raging, restless, trying to break free.
              </p>

              <p>
                I was somewhere between six and eight years old. Old enough to remember, too young to understand.
              </p>

              <p>
                The swim coach was a family friend. Sort of. The kind of person your parents know casually, wave to at community events, trust because everyone else seems to trust him. He ran the youth swim program at the university pool, and my parents thought it would be good for me—exercise, discipline, learning a skill.
              </p>

              <p>
                They didn't know what happened in the locker room.
              </p>

              <p>
                Nobody did.
              </p>

              <p className="font-semibold">
                I need to be careful here. Not because I'm ashamed—though I carried that shame for three decades like a stone in my chest. But because this isn't a story I'm telling for shock value. This isn't about graphic details or explicit descriptions. This is about what happens to a child's mind when trust gets violated in ways that create confusion instead of clarity.
              </p>

              <p>
                What happened wasn't violent. It wasn't terrifying in the way you might imagine. There were no threats, no pain, no overt force. That's what made it so confusing. It felt... wrong. But also not wrong. My body responded in ways that made me think maybe this was normal. Maybe this was something that happened to all kids and nobody talked about it. Maybe I was supposed to like it.
              </p>

              <p>
                The coach never told me to keep secrets. He didn't have to. The silence was built into the act itself—something done privately, in the locker room while other kids were still in the pool, quick and quiet and wrapped in a kind of casual normalcy that made me question whether it was happening at all.
              </p>

              <p>
                When I finally got to rehab—The Ranch, outside Nashville—my counselors had to convince me it counted as abuse. Had to argue with me about it.
              </p>

              <p>
                "But he didn't—it wasn't—" I kept trying to explain how it wasn't that bad, how I'd had worse things happen, how other people had real trauma and mine was just... confusion.
              </p>

              <p>
                "Shaun," my counselor said, looking me dead in the eye. "You were a child. An adult in a position of authority violated your body without your consent for his own gratification. What happened to you was sexual abuse. Real abuse. It doesn't matter that it wasn't violent. It doesn't matter that your body responded. You were six years old. You couldn't consent."
              </p>

              <p>I cried for three hours after that session.</p>

              <p>
                Because hearing it named—hearing someone say definitively that what happened to me was wrong, was abuse, was something I didn't deserve and didn't cause—shattered thirty years of rationalization in an instant.
              </p>

              <p>
                But I'm getting ahead of myself again. We're still in childhood, still in that basement pool where I learned to swim and learned something else too.
              </p>

              <div className="my-8 border-t border-b py-4">
                <p className="text-center text-muted-foreground">• • •</p>
              </div>

              <p>The worst part wasn't the violation itself.</p>

              <p>The worst part was that my body reacted.</p>

              <p>
                I was six years old. I didn't understand what was happening. But my nervous system did. And when a child's boundaries are violated in that way, the body doesn't ask permission. It just... responds.
              </p>

              <p>
                My body reacted. In ways I didn't understand. In ways that created terrible confusion.
              </p>

              <p>
                My body's response made me wonder if somehow I'd caused it. If I was complicit.
              </p>

              <p>
                I didn't have words for any of this at six years old. I just knew that something had happened that made me feel powerful and special and terrified and ashamed all at the same time.
              </p>

              <p>And I spent the next thirty years trying to recreate that feeling while simultaneously running from it.</p>

              <div className="my-8 border-t border-b py-4">
                <p className="text-center text-muted-foreground">• • •</p>
              </div>

              <p>The compulsive seeking started early. Way too early.</p>

              <p>
                I wasn't consciously trying to recreate what happened in the locker room. But my brain had learned something: certain images, certain behaviors created a chemical rush that made me feel powerful instead of powerless. In control instead of helpless.
              </p>

              <p>And once my nervous system learned that pattern, it couldn't unlearn it.</p>

              <p>
                Soon after these incidents, I'd found ways to access material I was way too young for. Material that reminded me of what happened in that locker room. Material that recreated that feeling.
              </p>

              <p>
                The stealing itself became part of the rush. The fear of getting caught. The thrill of getting away with it. The relief when I made it home.
              </p>

              <p>I'd hide what I'd taken. Study it. Feel that same electrical current I'd felt in the Cage.</p>

              <p>I knew it was wrong. I knew I'd be in trouble if caught. But I couldn't stop.</p>

              <p>
                I didn't know the word "compulsion" yet. I didn't know what a dopamine pathway was. I didn't know that trauma rewires young brains, that what happened to me in The Cage had just taught my nervous system its primary survival strategy: seek the chemical relief, no matter the cost.
              </p>

              <p>Fire came next.</p>

              <p>
                I became obsessed with it. Controlling it. My mom's spray deodorant plus a lighter—instant flamethrower. WD-40 cans. Bottlerockets. Firecrackers. Building small fires in the backyard and watching them burn exactly the way I wanted them to.
              </p>

              <p>
                Once I poured gasoline in the middle of our road, spelling out the word "SHIT" making it easily 20 feet long, and lit each letter on fire. Shit was literally going up in flames. I laughed watching it sear into the pavement. The laughter didn't last long—my dad pulled up right as I was lighting it, then shit really hit the fan.
              </p>

              <p>
                I was never destructive or violent in the sense of trying to hurt anyone or burn anything important down. But definitely dangerous. Definitely compulsive. I just needed to create something I could control. Light it. Watch it. Master it.
              </p>

              <p>Feel powerful instead of powerless.</p>

              <p>And the stealing continued through middle school. Taking things I didn't need, just to feel that rush. Just to prove I could get away with it.</p>

              <p>Three different behaviors. One mechanism. One desperate attempt to regulate a nervous system that had been knocked off its axis.</p>

              <p>I was six years old. And I was already an addict.</p>

              <p>I just didn't know it yet.</p>

              <div className="my-8 border-t border-b py-4">
                <p className="text-center text-muted-foreground">• • •</p>
              </div>

              <p>
                I wasn't the only one. There were several other boys that this was happening to. Probably more. I recognized the pattern—the way the coach would keep certain kids back after practice, the way we'd avoid each other's eyes in the locker room, the shared shame we couldn't name.
              </p>

              <p>
                And all of this was happening while everything else was falling apart too. The oxygen tent. The boiling water burn. One trauma stacked on another on another, my nervous system getting hammered from every direction that would lead to complete and total destruction in my life, and it would take decades and losing everything dear to me to even begin addressing what was happening.
              </p>

              <p>
                Years later, at The Ranch, my therapist would tell me she'd never seen a higher score on the PTSD assessment. "Complex trauma," she called it. Multiple traumatic events during critical developmental windows, each one compounding the effects of the others, rewiring my brain in ways that would take decades to untangle.
              </p>

              <div className="my-8 border-t border-b py-4">
                <p className="text-center text-muted-foreground">• • •</p>
              </div>

              <p>
                And like many children who experience this kind of confusion, I tried to make sense of it in ways that weren't appropriate. Ways that adults eventually noticed and gently redirected.
              </p>

              <p>When that happened, I felt a shame so profound I literally couldn't lift my head.</p>

              <p>
                That night, the phone rang. My mom called me into the kitchen. Her voice was gentle. Firm but not angry. She explained that what had been happening wasn't appropriate. That it needed to stop.
              </p>

              <p>
                I sat with my face tucked between my knees, my whole body folded in on itself, drowning in a shame I had no name for.
              </p>

              <p>I was six years old. And I already knew I was fundamentally broken.</p>

              <div className="my-8 border-t border-b py-4">
                <p className="text-center text-muted-foreground">• • •</p>
              </div>

              <p>
                For years I questioned whether my body's response meant something about my identity. About who I was. About what I wanted.
              </p>

              <p>It didn't. But the confusion lasted decades.</p>

              <p>
                It took until my forties to understand: abuse isn't about attraction. It's about power. And a child's physiological response isn't consent—it's biology.
              </p>

              <div className="p-6 bg-accent/20 rounded-lg border-l-4 border-primary my-8">
                <p className="font-semibold">
                  The Cage closed years ago. U Hall itself is gone now too—demolished just a few years back. The night before they tore it down, I took a long walk through Grounds. Stood outside the stadium in the darkness, took one last picture of the building where it all happened.
                </p>
                <p className="mt-4">
                  You can demolish the building. But the memory? That stays.
                </p>
                <p className="mt-4">
                  And I think about six-year-old Shaun, walking into that locker room, not knowing what was about to happen, not having the words to explain it when it did. I wish I could go back and tell him:
                </p>
                <p className="mt-4 italic">
                  It's not your fault. You didn't do anything wrong. Your body responding doesn't mean you wanted it. And one day—I promise—you'll tell this story out loud and it won't destroy you.
                </p>
              </div>
            </section>

            {/* Continue Reading Section */}
            <section className="my-16 p-8 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border-2 border-primary/20">
              <h2 className="text-3xl font-bold mb-6 text-center">Continue Reading</h2>
              <p className="text-lg mb-4 text-center">
                Want to read the rest of Shaun's story?
              </p>
              <p className="mb-6 text-center">
                <em>Crooked Lines: Bent, Not Broken</em> follows the complete journey from childhood trauma through active addiction, rock bottom, and the hard-won redemption of recovery. It's a story of resilience, hope, and the crooked lines that lead us home.
              </p>
              <div className="flex justify-center gap-4">
                <Button className="bg-primary hover:bg-primary/90" size="lg">
                  Get Updates on Book Release
                </Button>
                <Link href="/memoir">
                  <Button variant="outline" size="lg">
                    Learn More About the Book
                  </Button>
                </Link>
              </div>
            </section>

            {/* Recovery Resources */}
            <section className="my-16">
              <h2 className="text-3xl font-bold mb-6 text-center">Recovery Resources</h2>
              <p className="mb-6 text-center">
                If you or someone you love is struggling with addiction, please reach out:
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="font-bold text-lg mb-2">SAMHSA National Helpline</h3>
                  <p className="text-2xl font-bold text-primary mb-2">1-800-662-HELP (4357)</p>
                  <p className="text-sm text-muted-foreground">Free, confidential, 24/7 support in English and Spanish</p>
                </Card>

                <Card className="p-6">
                  <h3 className="font-bold text-lg mb-2">National Suicide Prevention Lifeline</h3>
                  <p className="text-2xl font-bold text-primary mb-2">988</p>
                  <p className="text-sm text-muted-foreground">Free, confidential crisis support 24/7</p>
                </Card>

                <Card className="p-6">
                  <h3 className="font-bold text-lg mb-2">Alcoholics Anonymous</h3>
                  <p className="text-sm text-muted-foreground mb-2">Find local meetings and support</p>
                  <a href="https://www.aa.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    www.aa.org
                  </a>
                </Card>

                <Card className="p-6">
                  <h3 className="font-bold text-lg mb-2">Narcotics Anonymous</h3>
                  <p className="text-sm text-muted-foreground mb-2">Find local meetings and support</p>
                  <a href="https://www.na.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    www.na.org
                  </a>
                </Card>
              </div>

              <p className="text-center mt-8 text-xl font-bold">
                You are not alone. Recovery is possible.
              </p>
            </section>

          </div>
        </div>
      </article>

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
            <p className="mt-2">This is an excerpt from <em>Crooked Lines: Bent, Not Broken</em>. No part of this excerpt may be reproduced without permission.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
