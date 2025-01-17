import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useRouter } from "next/router";
import Head from "next/head";
import { media } from "../../../styles/mediaQueries";

import { quizz } from "../../../utils/quizz";
import useUser from "../../../hooks/useUser";
import useUserAnswers from "../../../hooks/useUserAnswers";
import withAuth from "../../../hocs/withAuth";

const Quizz = () => {
  const { user } = useUser();
  const { userAnswers, setAnswer } = useUserAnswers();
  const router = useRouter();
  const { themeId, questionId } = router.query;

  const [currentAnswerIndex, setCurrentAnswerIndex] = useState(
    userAnswers.find((a) => a.questionId === questionId)?.answerIndex
  );

  useEffect(() => {
    setCurrentAnswerIndex(userAnswers.find((a) => a.questionId === questionId)?.answerIndex);
  }, [questionId]);

  const [theme, setTheme] = useState(quizz.find((theme) => theme._id === themeId) || { questions: [] } || {});
  useEffect(() => {
    if (themeId) setTheme(quizz.find((theme) => theme._id === themeId));
  }, [quizz, themeId]);

  const questions = theme.questions;

  const [questionIndex, setQuestionIndex] = useState(questions.findIndex((question) => question._id === questionId));
  const [question, setQuestion] = useState(questions[questionIndex]);
  useEffect(() => {
    const newIndex = questions.findIndex((question) => question._id === questionId);
    setQuestionIndex(newIndex);
    setQuestion(questions[newIndex]);
  }, [questions, questionId]);

  const [showHelp, setShowHelp] = useState(!!question?.help);
  useEffect(() => {
    setShowHelp(!!question?.help);
  }, [question]);

  const [userThemes, setUserThemes] = useState([
    ...userAnswers.reduce((themes, answer) => themes.add(answer.themeId), new Set()),
  ]);
  useEffect(() => {
    setUserThemes([...userAnswers.reduce((themes, answer) => themes.add(answer.themeId), new Set())]);
  }, [userAnswers.length]);

  const [showResultsButton, setShowResultsButton] = useState(false);
  useEffect(() => {
    setShowResultsButton(userThemes.length > 2);
  }, [userThemes.length]);

  const goToNextQuestion = () => {
    if (questionIndex < questions.length - 1) {
      const nextQuestionId = questions[questionIndex + 1]._id;
      return router.push(`/question/${themeId}/${nextQuestionId}`);
    }
    return router.push("/themes");
  };

  const goToPreviousQuestion = () => {
    if (questionIndex > 0) {
      const previousQuestionId = theme.questions[questionIndex - 1]._id;
      return router.push(`/question/${themeId}/${previousQuestionId}`);
    }
    return router.push("/themes");
  };

  const goToResults = () => router.push("/result");

  const goToThemes = () => router.push(`/themes`);

  const sendAnswer = async (e) => {
    await setAnswer({
      user: user._id,
      themeId: theme._id,
      questionId: questionId,
      answerIndex: Number(e.target.dataset.index),
    });
    goToNextQuestion();
  };

  useEffect(() => {
    if (!!questionId) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [questionId]);

  return (
    <>
      <Head>
        <title>
          {question?.fr} - {theme.fr} | Le Quizz du Berger
        </title>
      </Head>
      <ThemeHeaderContainer backgroundColor={theme.backgroundColor}>
        <ThemeNavigationContainer>
          <ThemeNavigationButton onClick={goToThemes} visible>
            ‹ Retour aux thèmes
          </ThemeNavigationButton>
          <ThemeTitle>{theme.fr}</ThemeTitle>
          <ThemeNavigationButton onClick={goToResults} visible={showResultsButton}>
            Voir les résultats ›
          </ThemeNavigationButton>
        </ThemeNavigationContainer>
        <MobileThemeTitle>{theme.fr}</MobileThemeTitle>
      </ThemeHeaderContainer>

      <BackgroundContainer>
        {/* <QuestionContainer> */}
        <QuestionTitle>{question?.fr}</QuestionTitle>
        {showHelp && (
          <QuestionHelp href={question?.help} target="_blank">
            Cliquez <strong>ici</strong> pour en savoir plus
          </QuestionHelp>
        )}
        <AnswerContainer>
          {question?.answers.map((answer, index) => {
            return (
              <AnswerButton isActive={currentAnswerIndex === index} onClick={sendAnswer} key={index} data-index={index}>
                {answer}
              </AnswerButton>
            );
          })}
        </AnswerContainer>
        {/* </QuestionContainer> */}

        <ProgressBarContainer>
          <ProgressBarSubContainer>
            <NavigationButton leftArrow={true} onClick={goToPreviousQuestion} />
            <ProgressBar>
              <Progress questionsProgress={questionIndex / questions.length} />
            </ProgressBar>
            <NavigationButton onClick={goToNextQuestion} />
          </ProgressBarSubContainer>
        </ProgressBarContainer>
      </BackgroundContainer>
    </>
  );
};

const ThemeHeaderContainer = styled.div`
  padding: 0 20px 0 20px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${(props) => props.backgroundColor}CC;
  ${media.mobile`
  padding: 0 15px 0 15px;
  justify-content: space-evenly;
  flex-direction: column;
  max-height: 126px;
  min-height: 90px;
  height: 110px;
`}
`;

const ThemeNavigationContainer = styled.div`
  width: 100%;
  max-width: 1024px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ThemeNavigationButton = styled.button`
  font-size: 14px;
  background-color: transparent;
  border: none;
  cursor: pointer;
  ${(props) => !props.visible && "opacity: 0;"}
`;

const ThemeTitle = styled.h2`
  font-family: Merriweather;
  font-weight: bold;
  font-size: 20px;
  text-align: center;
  ${media.mobile`
  display: none;
`}
`;

const MobileThemeTitle = styled.h2`
  display: none;
  ${media.mobile`
  text-align: center;
  display: block;
  font-family: Merriweather;
  font-weight: bold;
  font-size: 18px;
`}
`;

const BackgroundContainer = styled.div`
  padding: 40px 20px 120px 20px;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  ${media.mobile`
  padding: 40px 10px 100px 10px;
`};
`;

const QuestionTitle = styled.h2`
  margin-bottom: 40px;
  font-weight: 700;
  font-size: 24px;
  text-align: center;
`;

const QuestionHelp = styled.a`
  margin-top: -30px;
  margin-bottom: 40px;
  font-weight: 400;
  font-size: 12px;
  font-family: default;
  text-align: center;
  strong {
    text-decoration: underline;
  }
`;

const AnswerContainer = styled.div`
  max-width: 1020px;
  display: flex;
  grid-gap: 15px;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans,
    Helvetica Neue, sans-serif;
  align-items: center;
`;

const AnswerButton = styled.button`
  padding: 10px;
  width: 500px;
  letter-spacing: 0.01rem;
  min-height: 60px;
  font-size: 16px;
  background: ${(props) => (props.isActive ? `#111827` : `#ffffff`)};
  color: ${(props) => (props.isActive ? `#ffffff` : `black`)};
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  :active {
    background: #111827;
    color: white;
  }
  ${media.mobile`
  width: 300px;
`};
`;

const ProgressBarContainer = styled.div`
  position: fixed;
  bottom: 0;
  height: 80px;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0px -2px 3px #ddddddcc;
  background-color: white;
  ${media.mobile`
    max-height: 80px;
    min-height: 50px;
    height: 11vh;
  `}
`;
const ProgressBarSubContainer = styled.div`
  height: 100%;
  max-width: 1024px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  ${media.mobile`
    padding: 0 10px;
  `}
`;

const NavigationButton = styled.button`
  margin: ${(props) => (props.leftArrow ? "0 50px 0 0px" : "0 0px 0 50px")};
  height: 17px;
  min-width: 19px;
  background-color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  background-image: url(${(props) => (props.leftArrow ? "/left-arrow.svg" : "/right-arrow.svg")});
  background-repeat: no-repeat;
  background-size: cover;
  ${media.mobile`
    margin: ${(props) => (props.leftArrow ? "0 10px 0 0px" : "0 0px 0 10px")};
  `};
`;

const ProgressBar = styled.div`
  margin: 0 5px;
  width: 100%;
  height: 4px;
  background: #f3f4f6;
  border-radius: 8px;
  ${media.mobile`
`}
`;

const Progress = styled.div`
  width: ${(props) => props.questionsProgress * 100}%;
  height: 4px;
  background: #111827;
  border-radius: 8px;
`;

export default withAuth(Quizz);
