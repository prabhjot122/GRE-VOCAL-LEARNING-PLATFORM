import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, Target, BarChart3, BookOpen, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useLibrary } from "@/contexts/LibraryContext";
import { useLearning } from "@/contexts/LearningContext";

const QuizSystem = () => {
  const { libraries, selectedLibrary, selectLibrary } = useLibrary();
  const {
    currentSession,
    currentQuiz,
    currentQuestionIndex,
    startQuizSession,
    submitAnswer,
    nextQuestion,
    endSession,
    learningStats
  } = useLearning();

  // Local state
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [quizSettings, setQuizSettings] = useState({
    questionCount: 10,
    questionTypes: ['multiple-choice']
  });
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      handleTimeUp();
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  // Reset states when question changes
  useEffect(() => {
    setSelectedAnswer("");
    setShowResult(false);
    setTimeLeft(30); // 30 seconds per question
  }, [currentQuestionIndex]);

  const currentQuestion = currentQuiz?.[currentQuestionIndex];
  const progress = currentQuiz ? ((currentQuestionIndex + 1) / currentQuiz.length) * 100 : 0;
  const accuracy = currentSession && currentSession.totalAnswered > 0
    ? (currentSession.correctAnswers / currentSession.totalAnswered) * 100
    : 0;

  const handleStartQuiz = async () => {
    if (!selectedLibrary) {
      toast.error('Please select a library first');
      return;
    }

    const success = await startQuizSession(selectedLibrary.id, quizSettings.questionCount);
    if (success) {
      setTimerActive(true);
      setTimeLeft(30);
    }
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer.trim()) {
      toast.error('Please select an answer');
      return;
    }

    submitAnswer(selectedAnswer);
    setShowResult(true);
    setTimerActive(false);

    // Auto-advance after 2 seconds
    setTimeout(() => {
      handleNextQuestion();
    }, 2000);
  };

  const handleNextQuestion = () => {
    if (currentQuiz && currentQuestionIndex < currentQuiz.length - 1) {
      nextQuestion();
      setTimerActive(true);
    } else {
      handleEndQuiz();
    }
  };

  const handleTimeUp = () => {
    if (!showResult) {
      submitAnswer(""); // Submit empty answer
      setShowResult(true);
      setTimerActive(false);

      setTimeout(() => {
        handleNextQuestion();
      }, 2000);
    }
  };

  const handleEndQuiz = () => {
    setTimerActive(false);
    endSession();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Quiz setup screen
  if (!currentSession || !currentQuiz) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Vocabulary Quiz</h1>
            <p className="text-gray-600">Test your knowledge with interactive quizzes</p>
          </div>

          {/* Library Selection */}
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Select Library</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={selectedLibrary?.id.toString() || ''}
                onValueChange={(value) => {
                  const library = libraries.find(lib => lib.id.toString() === value);
                  if (library) selectLibrary(library);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a library" />
                </SelectTrigger>
                <SelectContent>
                  {libraries.map((library) => (
                    <SelectItem key={library.id} value={library.id.toString()}>
                      {library.name} ({library.word_count} words)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedLibrary && (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Available Words:</span>
                      <span>{selectedLibrary.word_count}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Number of Questions:</Label>
                    <Select
                      value={quizSettings.questionCount.toString()}
                      onValueChange={(value) => setQuizSettings({
                        ...quizSettings,
                        questionCount: parseInt(value)
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 Questions</SelectItem>
                        <SelectItem value="10">10 Questions</SelectItem>
                        <SelectItem value="15">15 Questions</SelectItem>
                        <SelectItem value="20">20 Questions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleStartQuiz}
                    className="w-full"
                    size="lg"
                    disabled={selectedLibrary.word_count === 0}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Quiz
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Quiz Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Words Studied:</span>
                  <span>{learningStats.totalWordsStudied}</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Accuracy:</span>
                  <span>{learningStats.averageAccuracy.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Study Streak:</span>
                  <span>{learningStats.streakDays} days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Active quiz screen
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Quiz Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedLibrary?.name} Quiz
            </h1>
            <p className="text-gray-600">
              Question {currentQuestionIndex + 1} of {currentQuiz.length}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className={`font-mono ${timeLeft <= 10 ? 'text-red-600' : 'text-gray-700'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleEndQuiz}>
              End Quiz
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>
              {currentSession.totalAnswered > 0 && (
                <span>{accuracy.toFixed(0)}% accuracy</span>
              )}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <Card className="w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="outline">
                  {currentQuestion.type.replace('-', ' ').toUpperCase()}
                </Badge>
                <Badge variant={currentQuestion.isCorrect === true ? "default" :
                              currentQuestion.isCorrect === false ? "destructive" : "secondary"}>
                  {showResult ? (currentQuestion.isCorrect ? "Correct" : "Incorrect") : "Unanswered"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {currentQuestion.question}
                </h2>

                {/* Multiple Choice */}
                {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
                  <RadioGroup
                    value={selectedAnswer}
                    onValueChange={setSelectedAnswer}
                    disabled={showResult}
                  >
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label
                          htmlFor={`option-${index}`}
                          className={`cursor-pointer ${
                            showResult && option === currentQuestion.correctAnswer
                              ? 'text-green-600 font-semibold'
                              : showResult && option === selectedAnswer && option !== currentQuestion.correctAnswer
                              ? 'text-red-600'
                              : ''
                          }`}
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {/* Fill in the Blank */}
                {currentQuestion.type === 'fill-blank' && (
                  <Input
                    value={selectedAnswer}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    disabled={showResult}
                    className={showResult ? (
                      selectedAnswer.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim()
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                    ) : ''}
                  />
                )}

                {/* True/False */}
                {currentQuestion.type === 'true-false' && (
                  <RadioGroup
                    value={selectedAnswer}
                    onValueChange={setSelectedAnswer}
                    disabled={showResult}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="True" id="true" />
                      <Label
                        htmlFor="true"
                        className={`cursor-pointer ${
                          showResult && "True" === currentQuestion.correctAnswer
                            ? 'text-green-600 font-semibold'
                            : showResult && "True" === selectedAnswer && "True" !== currentQuestion.correctAnswer
                            ? 'text-red-600'
                            : ''
                        }`}
                      >
                        True
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="False" id="false" />
                      <Label
                        htmlFor="false"
                        className={`cursor-pointer ${
                          showResult && "False" === currentQuestion.correctAnswer
                            ? 'text-green-600 font-semibold'
                            : showResult && "False" === selectedAnswer && "False" !== currentQuestion.correctAnswer
                            ? 'text-red-600'
                            : ''
                        }`}
                      >
                        False
                      </Label>
                    </div>
                  </RadioGroup>
                )}

                {/* Show correct answer if wrong */}
                {showResult && !currentQuestion.isCorrect && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-800 font-medium">
                        Correct answer: {currentQuestion.correctAnswer}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              {!showResult && (
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer.trim()}
                  className="w-full"
                  size="lg"
                >
                  Submit Answer
                </Button>
              )}

              {/* Next Button */}
              {showResult && (
                <Button
                  onClick={handleNextQuestion}
                  className="w-full"
                  size="lg"
                >
                  {currentQuestionIndex < currentQuiz.length - 1 ? 'Next Question' : 'Finish Quiz'}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default QuizSystem;
