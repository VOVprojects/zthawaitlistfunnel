import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QUIZ_QUESTIONS, calculateScore } from '../lib/quiz-data';
import { cn } from '../lib/utils';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';

export function Quiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const question = QUIZ_QUESTIONS[currentStep];
  const totalSteps = 13; // Hardcoded to match prompt percentages (e.g. 84% at result)
  const progress = Math.round((currentStep / totalSteps) * 100);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const handleNext = () => {
    setError('');
    
    // Validation
    if (question.type !== 'intro' && question.type !== 'result') {
      const answer = answers[question.id];
      
      // Allow empty text for whyApplying as per requirements
      const isTextAndEmptyAllowed = question.type === 'text' && (answer === undefined || answer === null || answer === '');
      
      if (!isTextAndEmptyAllowed && (answer === undefined || answer === null || answer === '')) {
        if (question.type === 'slider' && answer !== 0) {
           // Slider defaults to 0, but we need them to interact or at least confirm.
           // Actually, the prompt says: Error message if not moved from 0: "This field is required"
           if (answers[question.id] === undefined) {
             setError('This field is required');
             return;
           }
        } else {
          setError('Please answer this question to proceed.');
          return;
        }
      }
      if (question.type === 'slider' && answer === 0 && !answers[`${question.id}_touched`]) {
        setError('This field is required');
        return;
      }
    }

    if (currentStep < QUIZ_QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setError('');
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleOptionSelect = (value: string) => {
    setAnswers(prev => ({ ...prev, [question.id]: value }));
    setError('');
  };

  const onSubmitWaitlist = async (data: any) => {
    setIsSubmitting(true);
    setSubmitError('');
    
    const { score } = calculateScore(answers);

    try {
      const { error: dbError } = await supabase
        .from('users')
        .insert([
          {
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email,
            whatsapp: `+234${data.phone}`,
            country: 'Nigeria',
            qualification_score: score,
            qualification_answers: answers,
            qualified: true,
            position: 999999,
            referral_count: 0,
            is_vip: false,
          }
        ]);

      if (dbError) {
        if (dbError.code === '23505') { // Unique violation
          setSubmitError('This email is already on the waitlist. Check your inbox for your dashboard link.');
        } else {
          setSubmitError('Something went wrong. Please try again.');
          console.error(dbError);
        }
        setIsSubmitting(false);
        return;
      }

      // Call rpc function if it exists, ignoring errors if not set up
      try {
        await supabase.rpc('calculate_waitlist_positions');
      } catch (e) {
        // ignore
      }

      // Redirect
      window.location.href = '/welcome'; // Or wherever the beginner course is
    } catch (err) {
      setSubmitError('Connection failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const renderQuestionContent = () => {
    if (question.type === 'intro') {
      return (
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-[#0c1115] tracking-tight">
            Let's see if ZTHA is right for you
          </h1>
          <p className="text-lg md:text-xl text-[#1f3b3f] font-medium max-w-2xl mx-auto leading-relaxed">
            We only train serious individuals who are committed to learning, executing, tracking, and continually improving.
          </p>
          <p className="text-gray-600">
            Please answer a few questions so we can determine if you're qualified.
          </p>
          <button
            onClick={handleNext}
            className="mt-8 bg-[#ffc702] hover:bg-yellow-400 text-black font-bold py-4 px-10 rounded-full text-lg transition-transform hover:scale-105 active:scale-95"
          >
            I'm Ready — Begin
          </button>
        </div>
      );
    }

    if (question.type === 'result') {
      const { score, disqualified } = calculateScore(answers);
      const isQualified = score >= 18 && !disqualified;

      if (isQualified) {
        return (
          <div className="space-y-8 max-w-xl mx-auto">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-[#0c1115]">🎉 AWESOME! YOU'RE QUALIFIED!</h2>
              <h3 className="text-xl font-bold text-[#1f3b3f]">HERE'S WHAT TO DO NEXT.</h3>
              <p className="text-gray-700 leading-relaxed">
                You're exactly the kind of person we built ZTHA Academy for—someone who's WILLING, ABLE, and COMMITTED to transform their financial future. Let's secure your spot on the waitlist.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmitWaitlist)} className="space-y-5 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
              {submitError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm font-medium">
                  {submitError}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">First Name*</label>
                  <input
                    {...register("firstName", { required: "First name is required" })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffc702] focus:border-transparent outline-none transition-all"
                    placeholder="John"
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message as string}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Last Name*</label>
                  <input
                    {...register("lastName", { required: "Last name is required" })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffc702] focus:border-transparent outline-none transition-all"
                    placeholder="Doe"
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message as string}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Email Address*</label>
                <input
                  type="email"
                  {...register("email", { 
                    required: "Email is required",
                    pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" }
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffc702] focus:border-transparent outline-none transition-all"
                  placeholder="john@example.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Phone Number*</label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    +234
                  </span>
                  <input
                    type="tel"
                    {...register("phone", { required: "Phone number is required" })}
                    className="flex-1 min-w-0 block w-full px-3 py-3 rounded-none rounded-r-lg border border-gray-300 focus:ring-2 focus:ring-[#ffc702] focus:border-transparent outline-none transition-all"
                    placeholder="801 234 5678"
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message as string}</p>}
              </div>

              <div className="pt-2">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("consent", { required: "You must agree to receive updates" })}
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-[#0c1115] focus:ring-[#ffc702]"
                  />
                  <span className="text-sm text-gray-600 leading-relaxed">
                    I agree to receive updates about ZTHA Academy via WhatsApp, email, and browser notifications.
                  </span>
                </label>
                {errors.consent && <p className="text-red-500 text-xs mt-1">{errors.consent.message as string}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-6 bg-[#ffc702] hover:bg-yellow-400 text-black font-bold py-4 px-8 rounded-xl text-lg transition-all hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {isSubmitting ? (
                  <span className="animate-pulse">PROCESSING...</span>
                ) : (
                  <span>JOIN THE WAITLIST NOW →</span>
                )}
              </button>
            </form>
          </div>
        );
      } else {
        return (
          <div className="text-center space-y-6 max-w-xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0c1115]">Thank You For Your Interest</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Based on your responses, ZTHA Academy may not be the best fit for you right now. We recommend starting with our beginner-friendly course to build your foundation first.
            </p>
            <a
              href="https://example.com/beginner-course"
              className="inline-block mt-6 bg-[#ffc702] hover:bg-yellow-400 text-black font-bold py-4 px-8 rounded-full text-lg transition-transform hover:scale-105"
            >
              GET ACCESS TO BEGINNER COURSE →
            </a>
          </div>
        );
      }
    }

    return (
      <div className="max-w-2xl mx-auto w-full">
        <div className="mb-8">
          <span className="text-[#ffc702] font-bold text-xl md:text-2xl mb-2 block">
            {question.number}→
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-[#0c1115] leading-tight">
            {question.question}
          </h2>
          {question.helperText && (
            <p className="text-gray-500 mt-2 text-sm">{question.helperText}</p>
          )}
        </div>

        <div className="space-y-4">
          {question.type === 'radio' && (
            <div className="space-y-4 w-full">
              {question.options?.map((option) => (
                <motion.button
                  key={option.value}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOptionSelect(option.value)}
                  className={cn(
                    "w-full text-left p-5 rounded-xl border-2 transition-all duration-200 text-lg",
                    answers[question.id] === option.value
                      ? "border-[#ffc702] bg-yellow-50/50 shadow-md"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white"
                  )}
                >
                  <div className="flex items-center">
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-colors duration-200",
                      answers[question.id] === option.value
                        ? "border-[#ffc702]"
                        : "border-gray-300"
                    )}>
                      <AnimatePresence>
                        {answers[question.id] === option.value && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="w-3 h-3 rounded-full bg-[#ffc702]"
                          />
                        )}
                      </AnimatePresence>
                    </div>
                    <span className="font-medium text-gray-800">{option.label}</span>
                  </div>
                </motion.button>
              ))}
              <div className="pt-2 flex gap-4">
                <button
                  onClick={handlePrevious}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 px-8 rounded-xl text-lg transition-colors w-full md:w-auto"
                >
                  ← Previous
                </button>
                <button
                  onClick={handleNext}
                  className="bg-[#0c1115] hover:bg-gray-800 text-white font-bold py-4 px-8 rounded-xl text-lg transition-colors w-full flex-1"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {question.type === 'text' && (
            <div className="space-y-4">
              <input
                type="text"
                value={answers[question.id] || ''}
                onChange={(e) => {
                  setAnswers(prev => ({ ...prev, [question.id]: e.target.value }));
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNext();
                }}
                placeholder={question.placeholder}
                className="w-full p-5 text-lg border-2 border-gray-200 rounded-xl focus:border-[#ffc702] focus:ring-0 outline-none transition-all bg-white"
                autoFocus
              />
              <div className="flex gap-4">
                <button
                  onClick={handlePrevious}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 px-8 rounded-xl text-lg transition-colors w-full md:w-auto"
                >
                  ← Previous
                </button>
                <button
                  onClick={handleNext}
                  className="bg-[#0c1115] hover:bg-gray-800 text-white font-bold py-4 px-8 rounded-xl text-lg transition-colors w-full flex-1"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {question.type === 'slider' && (
            <div className="space-y-8 pt-4">
              <div className="relative pt-6 pb-2">
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={answers[question.id] ?? 0}
                  onChange={(e) => {
                    setAnswers(prev => ({ 
                      ...prev, 
                      [question.id]: Number(e.target.value),
                      [`${question.id}_touched`]: true 
                    }));
                    setError('');
                  }}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#ffc702]"
                />
                <div className="flex justify-between text-gray-500 font-medium mt-4 px-1">
                  <span>0</span>
                  <span>5</span>
                  <span>10</span>
                </div>
                <div className="text-center mt-8">
                  <span className="text-5xl font-bold text-[#ffc702]">
                    {answers[question.id] ?? 0}
                  </span>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handlePrevious}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 px-8 rounded-xl text-lg transition-colors w-full md:w-auto"
                >
                  ← Previous
                </button>
                <button
                  onClick={handleNext}
                  className="bg-[#0c1115] hover:bg-gray-800 text-white font-bold py-4 px-8 rounded-xl text-lg transition-colors w-full flex-1"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 font-medium mt-4"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col relative min-h-[60vh]">
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full"
          >
            {renderQuestionContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Bar */}
      {currentStep > 0 && (
        <div className="fixed bottom-0 right-0 p-6 md:p-8 z-10 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-gray-100 flex items-center space-x-4">
            <div className="w-24 md:w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#ffc702] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-bold text-sm text-[#0c1115]">{progress}% completed</span>
          </div>
        </div>
      )}
    </div>
  );
}
