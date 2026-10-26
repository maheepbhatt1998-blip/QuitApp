// Guided program. Two tracks: "Reduce" unlocks one lesson a day from the taper start,
// "Stay quit" unlocks one a day from the quit date. Each lesson is a short read plus one task.

export const TRACKS = [
  { id: 'reduce', title: 'Reduce', blurb: 'While you taper. How the hook works, what sets you off, and the skills you will need on quit day.' },
  { id: 'quit', title: 'Stay quit', blurb: 'Twenty-eight days from your quit date. What to expect each day and how to handle it.' },
];

const R = (day, title, minutes, body, prompt, placeholder = '') =>
  ({ id: `r${day}`, track: 'reduce', day, title, minutes, body, task: { prompt, placeholder } });
const Q = (day, title, minutes, body, prompt, placeholder = '') =>
  ({ id: `q${day}`, track: 'quit', day, title, minutes, body, task: { prompt, placeholder } });

export const LESSONS = [
  // ---------------- Reduce track ----------------
  R(1, 'How the hook works', 3, [
    'Nicotine reaches your brain about ten seconds after a puff. It triggers a release of dopamine, the chemical that marks something as worth repeating. Do that twenty times a day for years and the brain adapts: it grows extra nicotine receptors and turns down its own baseline. The result is that you feel slightly below normal whenever nicotine levels drop, which is every hour or two.',
    'Here is the part most smokers never see. The relief you feel when you light up is not stress leaving. It is withdrawal ending. The cigarette fixes a problem the previous cigarette created. Non-smokers do not have that problem at all.',
    'The taper you are starting shrinks the gap you have been filling. Each step down lets the brain begin dialling receptors back toward normal, so that when you reach zero, the drop is smaller than it would be from full strength.',
  ], 'Describe the last time you smoked or vaped when you did not actually want to. What was happening?', 'I was at my desk, not stressed, just...'),

  R(2, 'Why spacing beats cutting down', 3, [
    'People who "cut down" without a plan tend to drift back up within weeks. People who reduce on a fixed schedule, with set amounts and a set end date, quit at about the same rate as people who stop abruptly. The difference is structure.',
    'That is why the home screen shows a next-allowed time. Instead of deciding in the moment, you decide in advance. The scheduled gap breaks the automatic link between a cue and a puff: you reach for it, see you have twenty minutes to go, and wait. Waiting is the skill. Every wait is a rep.',
    'If a craving arrives before the timer, that is exactly what the SOS button is for. Open it, ride the three minutes, and see what is left.',
  ], 'List the three times of day you reach for it without thinking.', '1. First coffee  2. Walking to the car  3. ...'),

  R(3, 'Map your triggers', 4, [
    'Cravings are not random. Almost every one is set off by a cue: a time, a place, a feeling, a person, a drink. Your brain learned the pairing through thousands of repetitions, so the cue alone can now produce the urge.',
    'Common triggers: the first coffee, finishing a meal, getting in the car, a work break, alcohol, stress, boredom, seeing someone else smoke, and strong emotion of any kind. Most people have three or four that account for most of their cigarettes.',
    'Knowing yours changes everything that follows. A trigger you can predict is a trigger you can plan for. Tomorrow and the day after you will build those plans.',
  ], 'Write your top five triggers, strongest first.', '1. ...'),

  R(4, 'The four Ds', 3, [
    'When a craving hits, you need something to do that takes no thought. The four Ds have been used in quit programs for decades because they work and they are easy to remember.',
    'Delay: tell yourself "not for ten minutes." Most cravings crest and fade in three to five. Deep breathe: slow breaths with a longer out-breath settle the nervous system that nicotine has been jangling. Drink water: it occupies hands and mouth and the cold is a reset. Do something else: anything physical and short, a walk to the mailbox, twenty squats, washing a cup.',
    'The SOS button walks you through all four. Use it even on the taper when you are allowed one. Waiting while allowed is the best possible practice.',
  ], 'Which D will you reach for first, and where will you keep your water bottle so it is always in reach?', ''),

  R(5, 'The "just one" thought', 4, [
    'Before every cigarette there is a thought that gives permission. "I have had a hard day." "I will make it up tomorrow." "Just one won\'t matter." "I deserve it." The thought feels like a reason. It is actually the addiction talking in your own voice.',
    'Cognitive behavioural therapy calls these permission-giving thoughts, and the treatment is simple: catch them and answer them. Not with willpower, with a prepared reply. "I have had a hard day" gets "and a cigarette will make me feel worse in an hour." "Just one" gets "there has never been just one."',
    'Write the replies now, while you are calm. In the moment you will not think of them. You will only remember what you already wrote.',
  ], 'Write your three most common permission thoughts, and a one-line reply to each.', 'Thought: ...\nReply: ...'),

  R(6, 'If-then plans', 4, [
    'The single most reliable tool in behaviour-change research is embarrassingly simple: write down, in advance, exactly what you will do when a specific situation arises. "If X happens, then I will do Y." Psychologists call these implementation intentions, and across hundreds of studies they roughly double follow-through compared with general intentions like "I will try to resist."',
    'The reason is that a vague goal needs a decision in the moment, and in the moment the craving is making the decisions. An if-then plan has already decided. The cue itself becomes the reminder.',
    'Good ones are concrete. Not "if I am stressed, I will cope," but "if my supervisor emails after 6pm, I will put my phone in the kitchen and do ten push-ups." Make them for your three biggest triggers from day three.',
  ], 'Write an if-then plan for each of your top three triggers.', 'If ..., then I will ...'),

  R(7, 'Change the scenery', 3, [
    'Willpower is a terrible strategy against cues you see fifty times a day. Removing the cues is a good one. Tonight, clear out the ashtray, lighters, spare pods, chargers, the pack in the glove box, the emergency one in the drawer. Delete the vape shop from your favourites.',
    'Then change the routines that are welded to smoking. Have your coffee at the kitchen table instead of the balcony. Take a different route from the car to the office. Brush your teeth right after dinner. Small changes in sequence break the chain.',
    'You are not doing this because you are weak. You are doing it because the environment is strong, and you are allowed to change the environment.',
  ], 'List three things you will remove or move today, and one routine you will change.', ''),

  R(8, 'Tell one person', 3, [
    'Quitting with support roughly doubles your odds compared with going it alone. That does not require a group or a counsellor. It requires one person who knows what you are doing and will be glad when you tell them it is going well.',
    'Pick someone who will not nag and will not mock. Tell them your quit date. Ask for one thing: that they check in with you on quit day and a week later. If they smoke, ask them not to offer and not to smoke in front of you for the first two weeks.',
    'If no one fits, the quitline does. In the US, 1-800-QUIT-NOW is free, staffed by trained coaches, and can mail you nicotine patches at no cost in most states.',
  ], 'Who will you tell, and what exactly will you say? Write the message.', 'Hey, I wanted to tell you that I am quitting on ...'),

  R(9, 'Medication and nicotine replacement', 4, [
    'Nicotine replacement (patches, gum, lozenges) is not cheating. It separates the drug from the smoke and lets you taper the drug without the tar, carbon monoxide and ritual. In controlled trials it raises quit rates by about half, and combining a patch with a fast-acting form like gum works better than either alone.',
    'Varenicline is the most effective single medication and is available by prescription. Bupropion is another option. Both roughly double or triple quit rates. Side effects exist, so this is a conversation with a doctor or pharmacist, not a decision from an app.',
    'If you vape to get off cigarettes, that can work, but set a plan to taper the vape too, or you have swapped one dependence for another. If you are quitting vaping itself, the same medications apply.',
  ], 'Will you use NRT or medication? Write what you want to ask your doctor or pharmacist, or why you are choosing not to.', ''),

  R(10, 'Your quit-day plan', 4, [
    'Quit day goes better when it is boring. Plan it the way you would plan travel: what time you wake, what replaces the first cigarette, what you eat, where you will be at your usual trigger times, who you will see, and what you will do at 9pm when the day is almost done and the urge is sentimental.',
    'The night before: throw out whatever is left. Not hide. Throw out. Charge your phone so the SOS button is always there. Put the water bottle, the gum, the toothbrush where the cigarettes used to be.',
    'Plan one small reward for the end of the day. Not food, not a drink. Something you like that you would not normally do on a weekday. You are not celebrating the absence of something. You are celebrating the first day of the rest of it.',
  ], 'Write your quit-day plan, hour by hour where it matters.', '7:00 wake, shower first instead of coffee...'),

  // ---------------- Stay quit track ----------------
  Q(1, 'Day one', 3, [
    'Today the counter starts. Here is what to expect: cravings every hour or two, each lasting a few minutes, each feeling urgent and then fading whether or not you do anything. Irritability, a foggy head, maybe a headache. This is not a sign something is wrong. It is the sound of your brain recalibrating.',
    'Your body is already changing. Twenty minutes after the last one, heart rate and blood pressure drop. By tonight the carbon monoxide in your blood is back to normal.',
    'Use the SOS button generously. There is no limit. Every craving you ride out today makes tomorrow\'s smaller.',
  ], 'What is one thing you will do differently this morning to break the first pairing?', ''),

  Q(2, 'Withdrawal is recovery', 3, [
    'Day two is usually the hardest. Nicotine is nearly gone, the receptors are still clamouring, and the novelty of yesterday has worn off. Expect irritability, trouble concentrating, hunger, restless sleep, maybe a cough as your lungs begin clearing.',
    'Each of these symptoms is a system coming back online. The cough is cilia starting to sweep again. The hunger is taste and appetite returning. The restlessness is a nervous system no longer being sedated and spiked all day.',
    'Most of it peaks in the first 72 hours and eases over two to four weeks. You are closer to the peak than you think.',
  ], 'Note your symptoms today and rate the day from 1 to 10. You will compare later.', ''),

  Q(3, 'Seventy-two hours', 3, [
    'By now nicotine and its by-products have left your body. What remains is not chemical dependence. It is habit, memory, and a brain with extra receptors that will take six to twelve weeks to thin back to normal.',
    'This matters because the next cravings are a different kind. They are cue-driven: the coffee, the car, the break. They can feel just as strong, but they have no chemical teeth. They are echoes.',
    'Notice today what is already easier. Breathing after stairs. Waking without the first-thing-in-the-morning urgency. Name it.',
  ], 'Write what feels easier today than on day one, however small.', ''),

  Q(4, 'Coffee and the morning', 3, [
    'The morning cigarette is the strongest for most people because it ends the longest gap of the day and because it is welded to coffee. Nicotine also speeds up how fast your body clears caffeine, so after quitting the same coffee hits harder. If you feel jittery, that is why. Cut the coffee by a third for two weeks.',
    'Then break the pairing itself. Drink it somewhere you never smoked. Switch to tea for a week. Shower before the coffee instead of after. Hold the mug in the hand that used to hold the cigarette.',
    'It will feel wrong for about five days. Then it will feel like your morning.',
  ], 'Describe your new morning sequence, step by step.', ''),

  Q(5, 'Sleep and appetite', 3, [
    'Sleep is often rough for the first one to two weeks: vivid dreams, waking at 3am, feeling unrested. Nicotine was shaping your sleep architecture and the brain is rebuilding it. Keep a regular bedtime, no screens in bed, and skip caffeine after noon. It settles.',
    'Appetite goes up. Partly because food tastes better now, partly because nicotine was suppressing it, partly because your hands want something. Plan for it instead of fighting it: have crunchy snacks ready (carrots, apples, nuts, popcorn) and drink water before you reach for anything.',
    'Some weight gain is common and far less dangerous than smoking. You can address it in a month. Right now the job is staying quit.',
  ], 'List three snacks you will keep in reach and one change to your bedtime routine.', ''),

  Q(6, 'Stress without smoke', 4, [
    'The strongest myth about smoking is that it relieves stress. It relieves nicotine withdrawal, which feels like stress. Studies that follow smokers after they quit find that anxiety and depression scores drop over the following months, by about as much as taking an antidepressant.',
    'But the habit of reaching for something when stressed is real, and you need a replacement that is just as fast. Build a three-item kit you can do anywhere in two minutes: a breathing pattern (the SOS one works), a physical reset (cold water on wrists, a short walk), and a person or playlist.',
    'When stress comes, you will reach. Make sure there is something there to grab.',
  ], 'Write your three-item stress kit.', '1. ...\n2. ...\n3. ...'),

  Q(7, 'One week', 3, [
    'Seven days. Your sense of smell and taste are noticeably sharper. Circulation is improving. The dopamine system that nicotine hijacked is starting to respond to ordinary pleasures again: food, music, a good conversation.',
    'This is also where identity starts to shift. You have been someone "trying to quit." Try the other sentence on: "I don\'t smoke." Not "I quit," which refers to the past, but "I don\'t," which describes who you are now. Say it out loud once today.',
    'Mark the week. Not with a cigarette, obviously, and not with nothing. Something small that is yours.',
  ], 'How will you mark one week? And write the sentence "I don\'t smoke" in your own words.', ''),

  Q(8, 'Alcohol and nights out', 4, [
    'Alcohol is the single biggest trigger for relapse in the first months. It lowers inhibition, it is paired with smoking in memory, and other people are smoking. You do not have to avoid it forever. You do have to plan the first few times.',
    'Options, from safest to boldest: skip drinking for the first two weeks; go but drink something you never paired with smoking; tell the people you are with before the first drink; hold the drink in your smoking hand; step outside with smokers and don\'t smoke, which is hard but powerful; leave early with a planned excuse.',
    'Decide now, sober, which option you are using next time. Then do that one.',
  ], 'Plan your next drink or night out: where, with whom, and which option above.', ''),

  Q(9, 'Social pressure scripts', 3, [
    'Someone will offer you one. Someone will say "just have one, you\'ve been good." Someone will say "I thought you quit?" in a tone. You need a two-sentence reply you have practised, so you are not composing it with a craving in your ear.',
    'Keep it short and final. "No thanks, I don\'t smoke." Not "I\'m trying to quit," which invites negotiation. If pushed: "I\'m good, honestly." Then change the subject. You owe no one an explanation of your lungs.',
    'Rehearse it out loud twice today. It will feel silly. It works.',
  ], 'Write your two-sentence refusal, exactly as you will say it.', ''),

  Q(10, 'Boredom', 3, [
    'Smoking filled gaps: the wait for the bus, the pause between tasks, the end of a meal. Now those gaps are empty and the emptiness itself feels like a craving. It is not. It is unstructured time, and you can fill it with anything.',
    'Build a list of two-minute fillers you can do anywhere: a few stretches, one page of a book on your phone, a text to someone, a walk around the block, a glass of water, a photo of something you noticed. The content matters less than having the list ready.',
    'Boredom cravings are the weakest kind. They just need to be given something else to do.',
  ], 'List five two-minute gap fillers.', '1. ...'),

  Q(11, "I don't smoke", 3, [
    'There is a difference between a person who is trying not to smoke and a person who does not smoke. The first is in a daily fight. The second has no fight to have. The goal of the next few weeks is to move from the first to the second, and the move is mostly language.',
    'Every time you say "I quit" or "I\'m trying to quit," you reinforce that smoking is still part of your story. Try instead: "I don\'t smoke." "I\'m a non-smoker." The identity statement you wrote at setup appears in the SOS flow for this reason.',
    'Research on identity-based change suggests people who adopt the new identity early are more likely to stick. You get to decide who you are. Decide.',
  ], 'Write a short paragraph describing yourself as someone who does not smoke. Present tense.', 'I am someone who...'),

  Q(12, 'Slips vs relapse', 4, [
    'If you have a cigarette, you have had a cigarette. You have not "ruined everything," "failed," or "gone back to smoking." Psychologists call the all-or-nothing reaction the abstinence violation effect, and it is the main reason one slip turns into a pack. The slip does not cause the relapse. The story you tell about the slip does.',
    'What to do in the first hour after a slip: get away from the source, and do not buy or accept a second one. Open the SOS and log it honestly. Drink water, brush your teeth, change rooms. Then look at your numbers: the days, the money, the cravings beaten. They are all still true.',
    'A slip is information. What was the situation? What would an if-then plan for it look like? Write it, and keep going. Most people who quit for good slipped along the way.',
  ], 'Write your "if I slip" plan: the first three things you will do.', 'If I slip, I will 1) ... 2) ... 3) ...'),

  Q(13, 'Rewards that feel like rewards', 3, [
    'Nicotine gave you a small reliable reward dozens of times a day. Remove it and the day can feel flat, not because life is worse but because the reward circuitry is recalibrating. You can help it by deliberately adding small, real rewards.',
    'They need to be frequent and modest: a good coffee from the place you like, ten minutes of sun, a song, a stretch, a text to someone, a tick on a list. The app\'s plant, badges and counters are built for this too. They are not prizes. They are proof, and proof feels good.',
    'Then there is the money. It is real and it is accumulating. Decide what a chunk of it is for, something you will actually see and use, so the saving has a shape.',
  ], 'List five small things that genuinely feel like rewards to you, and one thing the saved money is for.', ''),

  Q(14, 'Two weeks', 3, [
    'Fourteen days. Circulation has improved to the point that walking and stairs are noticeably easier. Lung function is climbing. The receptors are measurably thinning. You are halfway to twenty-eight days, the point at which staying quit becomes far more likely than not.',
    'Look at your craving chart in Progress. The number per day is probably lower than week one, and the intensity you rate them is probably lower too. That trend is the whole story.',
    'Take a moment to list three things that are better today than two weeks ago. Concrete ones.',
  ], 'Three things that are better today than two weeks ago.', '1. ...'),

  Q(15, 'The two-week dip', 3, [
    'Somewhere around now, motivation often sags. The first week ran on adrenaline and novelty. Now it is just Tuesday, and you don\'t smoke, and the drama is gone. This is when people say "I\'ve proved I can do it" and have one. It is the most common relapse window after the first three days.',
    'The dip is normal and it is temporary. The fix is to stop relying on motivation at all. You have plans: if-then plans, a stress kit, a refusal script, an SOS button. Plans do not need you to feel like it.',
    'Reread the reasons you wrote at setup. If one has changed, change it. Then carry on being someone who does not smoke.',
  ], 'Reread your three reasons. Rewrite any that has changed, and add one that is new.', ''),

  Q(16, 'Hands and mouth', 2, [
    'A surprising amount of smoking is not about nicotine at all. It is about having something to do with your hands and something in your mouth. These habits outlast the chemical dependence by weeks.',
    'Give them something: a water bottle with a sports cap, sugar-free gum or mints, toothpicks, a straw, a pen to fidget with, a smooth stone in your pocket. Put the replacements exactly where the cigarettes used to live: the car console, the desk drawer, the jacket pocket.',
    'This is not a crutch. Non-smokers fidget too.',
  ], 'Pick two replacements and write where you will put each one.', ''),

  Q(17, 'Driving and commuting', 3, [
    'The car is a trigger for most smokers: enclosed, boring, private, and the exact place you lit up ten thousand times. Change what the car is.',
    'Clean it, properly, including the ashtray and the smell. Put a bottle of water and gum in the console. Start a podcast or audiobook you only listen to while driving, so the car becomes the place that story lives. If a particular turn or light was your lighting-up spot, take a different route for two weeks.',
    'Keep the windows up and the air fresh. The first time you notice the car does not smell of smoke, that is a milestone too.',
  ], 'Describe your new drive: what you will listen to, what is in the console, and any route change.', ''),

  Q(18, 'About weight', 3, [
    'People who quit gain an average of four to five kilograms over the first year, with a wide range. It is partly metabolism returning to normal and partly eating more. It is also far outweighed by what you have gained: a smoker would need to put on roughly forty kilograms to match the cardiovascular risk of smoking.',
    'You do not need to diet now. Two things help enough: drink water before snacks, and walk ten minutes a day, ideally at a time you used to smoke. Movement also blunts cravings for a short while afterwards.',
    'If weight becomes a real concern later, address it later, as a non-smoker. One change at a time.',
  ], 'Write one ten-minute movement you will do daily and when.', ''),

  Q(19, 'Mood', 3, [
    'Low mood in weeks two to four is common. The brain\'s reward system is still rebalancing, sleep may be patchy, and you have lost a ritual that punctuated your day. For most people it lifts on its own by week six, and long term, mood is better off nicotine than on it.',
    'Things that help: daylight in the morning, movement, regular meals, talking to someone, and keeping the small rewards from day thirteen going. Avoid the trap of a drink to lift it; alcohol lowers mood and raises relapse risk.',
    'If low mood is severe, lasts more than a couple of weeks, or you have a history of depression, talk to a doctor. Quitting is safe for people with depression, but it is worth having support.',
  ], 'Rate your mood this week from 1 to 10 and write one thing that lifted it.', ''),

  Q(20, 'Your cravings are shrinking', 3, [
    'Open Progress and look at cravings by hour and by trigger. You should see fewer per day than in week one, and the intensity you rate them lower. Where they cluster tells you which triggers are still live and which have gone quiet.',
    'This is the moment to make one more if-then plan for the trigger that is still loudest. The others are fading on their own; this one needs a nudge.',
    'Data is reassuring in a way feelings are not. On a hard day, the chart still says what it says.',
  ], 'Look at your craving chart. What do you notice, and what is your plan for the loudest remaining trigger?', ''),

  Q(21, 'Three weeks', 3, [
    'You may have heard that it takes twenty-one days to form a habit. It is not true; the real research found an average of about two months, with a huge range. But three weeks is long enough that the new routines are no longer strange. The coffee without a cigarette is just coffee now.',
    'List the triggers you have already faced without smoking: the first drink, the stressful day, the car, the break. Each is a situation you have now rehearsed as a non-smoker, and the brain learns from rehearsal.',
    'The remaining ones will come. You will handle them the same way.',
  ], 'List the triggers you have faced without smoking so far.', ''),

  Q(22, 'The "I\'ve got this" trap', 3, [
    'Confidence is good. Overconfidence has a particular shape: "I\'ve proved I can quit, so one won\'t hurt." Or: "I want to see if I can have one and not go back." This is the addiction testing a new door.',
    'Here is why it fails. The extra nicotine receptors are still there for months, and they light up at the first dose. For most people a single cigarette after weeks off produces a craving storm far stronger than the one they had been feeling. "Just one to test it" is the most expensive experiment in quitting.',
    'You do not need to test it. You already know the result. Write your answer to the thought now.',
  ], 'Write your reply to "just one to see if I can handle it."', ''),

  Q(23, 'The money', 2, [
    'Look at the kept-money figure on Home. It is not an estimate of what you might have saved; it is what you did not spend, compared with what you were spending. It will keep growing every day for the rest of your life.',
    'Money that quietly stays in a bank account does not feel like anything. Give it a shape. Pick something you want, work out when the counter reaches it, and buy it on that day. Then pick the next thing.',
    'It is a small ritual, and small rituals are what you are replacing.',
  ], 'What will the saved money become at three months? At one year?', ''),

  Q(24, 'Tell your story', 2, [
    'Explaining something to someone else is the fastest way to make it part of who you are. You know things now that you did not know a month ago: what cravings actually feel like, how long they last, what worked for you on day two.',
    'Write a short message to someone who wants to quit. Not advice from an expert; just what you would tell a friend. You do not have to send it. But if there is someone who would want to read it, consider it.',
    'You are allowed to be a little proud.',
  ], 'Write three sentences to someone who wants to quit.', ''),

  Q(25, 'Vaping, if that is part of this', 3, [
    'If you quit cigarettes but still vape, you have done the hard part for your lungs and heart. The nicotine dependence is still there, though, and most people find the vape creeps up to fill the space. Set a plan for it: either taper the nicotine strength down over weeks and then stop, or set a quit date and treat it exactly as you treated cigarettes.',
    'If you were quitting vaping all along, this lesson is just a check-in. Vape withdrawal follows the same timeline. The device habit is often stronger than the cigarette habit because it was always in your hand; the hands-and-mouth replacements matter more.',
    'Either way, the goal is the same: nothing that delivers nicotine, so the receptors can finish resetting.',
  ], 'If you still use nicotine in any form, write your plan to end it. If not, write how you will stay clear of it.', ''),

  Q(26, 'Rare triggers', 3, [
    'The everyday triggers are mostly handled now. The dangerous ones are the rare ones you have not rehearsed: a funeral, a breakup, a holiday back home, a reunion with old smoking friends, a long flight, a crisis at work.',
    'You cannot practise them, but you can plan for them. For each: what will be hard about it, who will be there, where you will step out to, and what you will say and do instead. Write the if-then plan now so it exists before the event does.',
    'Most people who relapse after months do so in exactly one of these moments, and almost all of them say they did not see it coming. You will.',
  ], 'List three rare situations that could be hard, and an if-then plan for each.', ''),

  Q(27, 'Your maintenance plan', 3, [
    'After day twenty-eight the daily lessons stop, and the app shifts from a daily companion to a background one. Decide now how you will use it: keep the SOS button handy, check the Progress screen once a week, and log honestly if anything happens.',
    'Agree with yourself on what you will do if you slip in month three or month nine: open the app, log it, reread day twelve, and tell your one person. No story about failure. Just the plan.',
    'Think of it like a smoke alarm. You hope not to need it. You keep the battery in.',
  ], 'Write your maintenance plan: how often you will check in, and what you will do if you slip.', ''),

  Q(28, 'Twenty-eight days', 3, [
    'Four weeks. People who reach this point are about five times more likely to stay quit for good than people on day one. Your lungs are measurably clearer, your circulation is better, your receptors are most of the way back to normal, and you have handled a month of triggers as a person who does not smoke.',
    'Look back at what you wrote on day one and day two. The person who wrote those was in the thick of it. You are not that person any more.',
    'Write a letter to yourself on day one. Tell them what you know now. Then go and mark the day in a way that is yours.',
  ], 'Write a letter to yourself on day one.', 'Dear day-one me,'),
];
