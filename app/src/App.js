import React, { useEffect, useState } from "react";
import { Route, Switch, Redirect } from "react-router-dom";
import { useLocation } from "react-router";
import GlobalStyles from "./styles/globalStyle";

import Home from "./scenes/Home";
import LoginPage from "./scenes/LoginPage";
import ThemeSelect from "./scenes/ThemeSelect";
import Quizz from "./scenes/Quizz";
import Result from "./scenes/Result";
import API from "./services/api";
import Layout from "./components/Layout";

const App = () => {
  const [user, setUserState] = useState({});
  const [quizz, setQuizz] = useState([]);
  const [needLoading, setNeedLoading] = useState(!!document.cookie.includes("jwt"));
  const [loading, setLoading] = useState(!!document.cookie.includes("jwt"));
  const [answersList, setAnswersList] = useState([]);
  const location = useLocation();
  const [themeId, questionId] = location.pathname.split("/").filter((_, i) => i > 1);

  const [currentAnswerIndex, setCurrentAnswerIndex] = useState(
    answersList.find((a) => a.questionId === questionId)?.answerIndex
  );

  const getQuizz = async () => {
    const response = await API.get({ path: "/quizz" });
    if (!response.ok)
      return alert(
        response.error || "Erreur lors de l'obtention du quizz, veuillez réessayer plus tard"
      );
    setQuizz(response.data);
  };

  const getUser = async () => {
    const response = await API.getWithCreds({ path: "/user/me" });
    if (!response?.ok) {
      document.cookie = null;
      return;
    }
    setUser(response.data);
  };

  const getAnswers = async () => {
    const response = await API.getWithCreds({ path: "/answer" });
    if (response.ok) {
      setAnswersList(response.data);
      setCurrentAnswerIndex(response.data.find((a) => a.questionId === questionId)?.answerIndex);
    }
  };

  const setUser = (user) => {
    setUserState(user);
    setNeedLoading(false);
    setLoading(false);
    getAnswers();
  };

  const setAnswersListState = (newAnswer) => {
    const existingAnswer = answersList.find((a) => a.questionId === newAnswer.questionId);
    if (!!existingAnswer) {
      setAnswersList(
        answersList.map((a) => (a.questionId === newAnswer.questionId ? newAnswer : a))
      );
    } else {
      setAnswersList([...answersList, newAnswer]);
    }
  };

  const setAnswer = async (body) => {
    const lastCurrentAnswerIndex = currentAnswerIndex;
    const nextCurrentAnswerIndex = parseInt(body.answerIndex, 10);

    setCurrentAnswerIndex(nextCurrentAnswerIndex);
    setLoading(true);
    const response = await API.postWithCreds({ path: "/answer", body });
    setLoading(false);
    if (!response.ok) {
      alert(response.error);
      setCurrentAnswerIndex(lastCurrentAnswerIndex);
      return false;
    }
    setAnswersListState(response.data);
    return true;
  };

  useEffect(() => {
    if (needLoading) {
      getUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    getQuizz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentAnswerIndex(answersList.find((a) => a.questionId === questionId)?.answerIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeId, questionId]);

  if (needLoading) return <div>Loading...</div>;

  return (
    <>
      <GlobalStyles />
      <Layout loading={loading} user={user} setUser={setUser}>
        <Switch>
          <Route path="/home" render={(props) => <Home user={user} setUser={setUser} />} />
          <Route
            path="/login"
            render={(props) => <LoginPage {...props} user={user} setUser={setUser} />}
          />
          <RestrictedRoute
            path="/theme"
            user={user}
            Component={(props) => <ThemeSelect {...props} setUser={setUser} quizz={quizz} />}
          />
          <RestrictedRoute
            path="/question/:themeId/:questionId"
            exact
            user={user}
            Component={(props) => (
              <Quizz
                {...props}
                quizz={quizz}
                user={user}
                setAnswer={setAnswer}
                currentAnswerIndex={currentAnswerIndex}
              />
            )}
          />
          <RestrictedRoute
            path="/result"
            exact
            user={user}
            Component={(props) => <Result {...props} setUser={setUser} quizz={quizz} />}
          />
          <RestrictedRoute
            path="/"
            exact
            user={user}
            Component={() => <Redirect to="/theme" setUser={setUser} quizz={quizz} />}
          />
        </Switch>
      </Layout>
    </>
  );
};

const RestrictedRoute = ({ Component, user, ...rest }) => {
  return (
    <Route
      {...rest}
      render={(props) =>
        user?._id ? <Component {...props} user={user} /> : <Redirect to="/login" />
      }
    />
  );
};

export default App;
