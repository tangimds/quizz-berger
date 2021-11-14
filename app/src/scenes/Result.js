/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { getCandidatesScorePerThemes } from "../utils/score";
import { media, minMedia } from "../styles/mediaQueries";
import UserContext from "../contexts/user";
import DataContext from "../contexts/data";
import { getFromSessionStorage, setToSessionStorage } from "../utils/storage";
import ModalLogin from "../components/ModalLogin";
import ModalShare from "../components/ModalShare";
import { useHistory, useParams } from "react-router";
import API from "../services/api";
import Loader from "../components/Loader";
import getUserThemes from "../utils/getUserThemes";
import Podium from "../components/Podium";
import QuizzButton from "../components/QuizzButton";

const Result = () => {
  const userContext = useContext(UserContext);
  const { quizz, candidates, getFriends, friends /* getCandidates */ } = useContext(DataContext);
  const { userPseudo } = useParams();
  const history = useHistory();
  const [publicUser, setPublicUser] = useState({});
  const [publicUserAnswers, setPublicUserAnswers] = useState([]);

  const publicPage = !!userPseudo;

  const user = publicPage ? publicUser : userContext.user;
  const userAnswers = publicPage ? publicUserAnswers : userContext.userAnswers;

  const userThemes = getUserThemes(userAnswers);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCandidates, setShowCandidates] = useState(
    Boolean(getFromSessionStorage("selectedCandidates", false))
  );
  const [showThemes, setShowThemes] = useState(
    Boolean(getFromSessionStorage("selectedThemes", false))
  );
  const [showFriends, setShowFriends] = useState(
    Boolean(getFromSessionStorage("selectedFriends", false))
  );

  const [newFriend, setNewFriend] = useState("");
  const [loadingFriend, setLoadingFriend] = useState(false);

  const allCandidates = candidates.map((c) => c.pseudo);
  const allFriends = friends.map((c) => c.pseudo);
  const [selectedCandidates, setSelectedCandidates] = useState(() => {
    if (publicPage) return allCandidates;
    return getFromSessionStorage("selectedCandidates", allCandidates);
  });
  const [selectedFriends, setSelectedFriends] = useState(() => {
    if (publicPage) return [];
    return getFromSessionStorage("selectedFriends", allFriends);
  });
  const [selectedThemes, setSelectedThemes] = useState(() => {
    const allThemes = userThemes;
    if (publicPage) return allThemes;
    const previousThemesSelected = getFromSessionStorage("selectedThemes", []);
    if (!previousThemesSelected.length) return allThemes;
    if (userThemes.length !== previousThemesSelected.length) return previousThemesSelected;
    return allThemes;
  });

  const onSelectCandidates = (e) => {
    const pseudo = e.target.dataset.pseudo;

    if (!selectedCandidates.find((p) => p === pseudo)) {
      setSelectedCandidates([...selectedCandidates, pseudo]);
    } else {
      setSelectedCandidates(selectedCandidates.filter((c) => c !== pseudo));
    }
  };

  const onSelectFriends = (e) => {
    const pseudo = e.target.dataset.pseudo;

    if (!selectedFriends.find((p) => p === pseudo)) {
      setSelectedFriends([...selectedFriends, pseudo]);
    } else {
      setSelectedFriends(selectedFriends.filter((c) => c !== pseudo));
    }
  };

  const onSelectThemes = (e) => {
    const themeId = e.target.dataset.themeid;
    if (selectedThemes.includes(themeId)) {
      setSelectedThemes(selectedThemes.filter((id) => id !== themeId));
    } else {
      setSelectedThemes([...selectedThemes, themeId]);
    }
  };

  const newFriendTimeout = useRef(null);
  const setNewFriendRequest = async (e) => {
    const newName = e.target.value;
    setNewFriend(e.target.value);
    if (
      newName?.length < 3 ||
      allFriends.includes(newName) ||
      userContext?.user?.pseudo === newName
    ) {
      setLoadingFriend(false);
      return clearTimeout(newFriendTimeout.current);
    }
    newFriendTimeout.current = setTimeout(async () => {
      setLoadingFriend(true);
      const response = await API.get({ path: `/user/friends/${newName}` });
      if (response.ok) {
        if (window.confirm(`Voulez-vous ajouter ${response.data.pseudo} à vos amis ?`)) {
          console.log("ok", response.data);
          setLoadingFriend(true);
          await API.put({
            path: "/user",
            body: { friends: [...(userContext?.user.friends || []), response.data] },
          });
          await getFriends();
          setLoadingFriend(false);
          setNewFriend("");
        } else {
          setLoadingFriend(false);
        }
      } else {
        setLoadingFriend(false);
        if (response.code === "NOT_PUBLIC")
          alert(
            `${newName} n'a pas cliqué sur "Partager" en haut à droite de cette page. Demandez-lui !`
          );
        console.log("not ok", response.data);
      }
    }, 500);
  };

  const candidatesScorePerThemes = getCandidatesScorePerThemes(
    userAnswers.filter((a) => selectedThemes.includes(a.themeId)),
    candidates.map((c) => ({
      ...c,
      answers: c.answers.filter((a) => selectedThemes.includes(a.themeId)),
    })),
    quizz
  );

  const friendsScorePerThemes = getCandidatesScorePerThemes(
    userAnswers.filter((a) => selectedThemes.includes(a.themeId)),
    friends.map((f) => ({
      ...f,
      answers: f.answers.filter((a) => selectedThemes.includes(a.themeId)),
    })),
    quizz
  );

  const filteredPersons = [
    ...candidatesScorePerThemes.filter((candidate) =>
      selectedCandidates.includes(candidate?.pseudo)
    ),
    ...friendsScorePerThemes.filter((friend) => selectedFriends.includes(friend?.pseudo)),
  ];

  const personsScore = filteredPersons.map((c) => ({
    _id: c._id,
    pseudo: c.pseudo,
    total: c.total,
    totalMax: c.totalMax,
  }));

  useEffect(() => {
    if (candidates.map((c) => c.pseudo).length !== selectedCandidates.length) {
      setToSessionStorage("selectedCandidates", selectedCandidates);
    } else {
      window.sessionStorage.removeItem("selectedCandidates");
    }
  }, [selectedCandidates.length]);

  useEffect(() => {
    if (userThemes.length !== selectedThemes.length) {
      setToSessionStorage("selectedThemes", selectedThemes);
    } else {
      window.sessionStorage.removeItem("selectedThemes");
    }
  }, [selectedThemes.length]);

  useEffect(() => {
    getFriends();
  }, []);

  const getPublicUser = async () => {
    const publicUserResponse = await API.get({ path: `/user/${userPseudo}` });
    if (!publicUserResponse.ok) return history.push("/");
    setPublicUser(publicUserResponse.data);
    const publicUserAnswersResponse = await API.get({ path: `/answer/${userPseudo}` });
    if (!publicUserAnswersResponse.ok) return history.push("/");
    setSelectedThemes(getUserThemes(publicUserAnswersResponse.data));
    setPublicUserAnswers(publicUserAnswersResponse.data);
    setSelectedCandidates(allCandidates);
  };

  useEffect(() => {
    if (userPseudo) getPublicUser();
  }, [userPseudo]);

  useEffect(() => {
    if (userPseudo) setSelectedCandidates(allCandidates);
  }, [candidates.length]);

  const renderTitle = () => {
    if (!publicPage && !user?.pseudo) return "Voici vos résultats";
    const name = user?.pseudo?.charAt(0).toUpperCase() + user?.pseudo?.slice(1);
    if (!!publicPage) {
      return `Voici les résultats de ${name}`;
    }
    return `${name}, voici vos résultats`;
  };

  const isLoading = !!publicPage && !user?.pseudo;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <>
      <BackgroundContainer>
        <Container>
          <Header>
            <Title>{renderTitle()}</Title>
            {!publicPage && (
              <SaveContainer>
                {!user?.pseudo && (
                  <>
                    <SaveButton
                      onClick={() => {
                        setShowLoginModal(true);
                        document.body.style.overflow = "hidden";
                      }}>
                      Enregistrer
                    </SaveButton>
                    <Tiret />
                  </>
                )}
                <SaveButton
                  onClick={() => {
                    if (!user?.pseudo) setShowLoginModal(true);
                    setShowShareModal(true);
                    document.body.style.overflow = "hidden";
                  }}>
                  Partager
                </SaveButton>
              </SaveContainer>
            )}
          </Header>
        </Container>
        <PodiumContainer>
          <Podium fullHeight personsScore={personsScore} />
        </PodiumContainer>
        <TipContainer>
          <Tip>Vous pouvez cliquer sur le nom d'un candidat pour voir ses réponses</Tip>
        </TipContainer>
        <div>
          <Title>Aller plus loin</Title>
        </div>
        <ChartsContainer>
          <LeftContainer>
            <OpenButtonContainer onClick={() => setShowCandidates((show) => !show)}>
              <OpenButton isActive={showCandidates}>&#9654;</OpenButton>
              <SubTitle>Afficher/masquer des candidats</SubTitle>
            </OpenButtonContainer>
            <ButtonsContainer isActive={showCandidates}>
              {candidatesScorePerThemes.map((candidate) => (
                <ButtonStyled
                  key={candidate?.pseudo}
                  data-pseudo={candidate?.pseudo}
                  isActive={!!selectedCandidates.find((c) => c === candidate?.pseudo)}
                  onClick={onSelectCandidates}>
                  {candidate?.pseudo}
                </ButtonStyled>
              ))}
            </ButtonsContainer>
            <OpenButtonContainer onClick={() => setShowThemes((show) => !show)}>
              <OpenButton isActive={showThemes}>&#9654;</OpenButton>
              <SubTitle>Afficher/masquer des thèmes</SubTitle>
            </OpenButtonContainer>
            <ButtonsContainer isActive={showThemes}>
              {userThemes.map((userThemeId) => {
                const theme = quizz.find((t) => t._id === userThemeId);
                return (
                  <ButtonStyled
                    key={userThemeId}
                    data-themeid={theme._id}
                    backgroundColor={theme.backgroundColor}
                    isActive={!!selectedThemes.find((c) => c === theme._id)}
                    onClick={onSelectThemes}>
                    {theme.fr}
                  </ButtonStyled>
                );
              })}
            </ButtonsContainer>
            <OpenButtonContainer onClick={() => setShowFriends((show) => !show)}>
              <OpenButton isActive={showFriends}>&#9654;</OpenButton>
              <SubTitle>Se comparer à mes amis</SubTitle>
            </OpenButtonContainer>
            <ButtonsContainer isActive={showFriends}>
              {friendsScorePerThemes.map((friend) => (
                <ButtonStyled
                  key={friend?.pseudo}
                  data-pseudo={friend?.pseudo}
                  isActive={!!selectedFriends.find((c) => c === friend?.pseudo)}
                  onClick={onSelectFriends}>
                  {friend?.pseudo}
                </ButtonStyled>
              ))}
              <InputWithLoader>
                <FriendsInput
                  placeholder={
                    !!loadingFriend ? `Ajout de ${newFriend}...` : "Tapez le pseudo d'un ami"
                  }
                  value={!!loadingFriend ? null : newFriend}
                  onChange={setNewFriendRequest}
                />
                <Loader size="20px" isLoading={loadingFriend} displayOnLoadingOnly />
              </InputWithLoader>
            </ButtonsContainer>
          </LeftContainer>
          <RightContainer>
            {selectedThemes
              .map((themeId) => ({
                themeId,
                personsScore: filteredPersons?.map((c) => ({
                  _id: c._id,
                  pseudo: c.pseudo,
                  total: c.scorePerThemes?.find((score) => themeId === score.themeId)?.percent,
                  totalMax: 100,
                })),
              }))
              .map(({ personsScore, themeId }) => (
                <ThemePodiumContainer key={themeId}>
                  <Podium
                    personsScore={personsScore}
                    noPadding
                    fullHeight
                    title={quizz.find((quizztheme) => quizztheme._id === themeId).fr}
                  />
                </ThemePodiumContainer>
              ))}
          </RightContainer>
        </ChartsContainer>
      </BackgroundContainer>
      <Loader isLoading={isLoading} withBackground />
      <ModalShare
        isActive={showShareModal}
        onCloseModal={(e) => {
          if (e?.target !== e?.currentTarget) return;
          setShowShareModal(false);
          document.body.style.overflow = "visible";
        }}
      />
      <ModalLogin
        title={showShareModal ? "Enregistrez vos résultats d'abord" : "Enregistrez-vous"}
        isActive={showLoginModal}
        onForceCloseModal={(e) => {
          setShowLoginModal(false);
          document.body.style.overflow = "visible";
        }}
        onCloseModal={(e) => {
          if (e.target !== e.currentTarget) return;
          setShowLoginModal(false);
          setShowShareModal(false);
          document.body.style.overflow = "visible";
        }}
      />
    </>
  );
};

const BackgroundContainer = styled.div`
  padding: 80px 10px 0 10px;
  ${minMedia.desktop`
    height: calc(100vh - 80px);
    overflow-x: hidden;
    overflow-y: auto;
  `}
  ${media.mobile`
    padding: 3vh 10px 1px 10px;
  `}

  > div {
    margin: 0 auto 2vh;
    max-width: 1024px;
  }
  > section {
    margin: 0 -10px;
  }
`;

const Container = styled.div`
  /* height: 80%; */
`;

const ChartsContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  ${minMedia.desktop`
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
  `}
  ${media.mobile`
    flex-direction: column;
`}
`;

const LeftContainer = styled.div`
  position: relative;
  > p {
    margin-bottom: 20px;
    font-size: 16px;
    color: #111827;
  }
  ${minMedia.desktop`
  width: 50%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  `}
  ${media.mobile`
      width: 100%;
  `}
`;

const Title = styled.h2`
  font-family: Merriweather;
  font-weight: bold;
  font-size: 30px;
  color: #082d0f;
  margin-bottom: 5px;
`;

const ThemePodiumContainer = styled.div`
  height: max(15vh, 400px);
  width: 100%;
`;

const OpenButtonContainer = styled.button`
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  border: none;
  background-color: transparent;
  cursor: pointer;
`;

const SubTitle = styled.h3`
  font-family: Merriweather;
  font-weight: bold;
  font-size: 20px;
  text-align: left;
  color: #111827;
  ${media.mobile`
  font-size: 16px;
`}
`;

const PodiumContainer = styled.section`
  height: 50vh;
  margin-bottom: 5vh !important;
`;

const OpenButton = styled.span`
  margin-right: 10px;
  border: none;
  background-color: transparent;
  transform: ${(props) => (props.isActive ? "rotate(90deg)" : "none")};
  transition: transform 0.1s linear;
  cursor: pointer;
`;

const ButtonsContainer = styled.div`
  max-width: 500px;
  width: auto;
  margin-bottom: 20px;
  display: ${(props) => (props.isActive ? "flex" : "none")};
  grid-template-columns: auto auto auto;
  flex-flow: row wrap;
  grid-gap: 12px;
`;

const getBackgroundColor = ({ backgroundColor, isActive }) => {
  if (!!backgroundColor) {
    return `${backgroundColor}${isActive ? "CC" : "00"}`;
  }
  return isActive ? "#111827" : "white";
};

const getColor = ({ backgroundColor, isActive }) => {
  if (!!backgroundColor) {
    return isActive ? "#111827" : backgroundColor;
  }
  return isActive ? "white" : "#111827";
};

const getBorderColor = ({ backgroundColor, isActive }) => {
  if (!!backgroundColor) return backgroundColor;
  return "#111827";
};

const ButtonStyled = styled.button`
  padding: 8px 15px;
  width: auto;
  height: auto;
  max-height: 55px;
  /* flex-shrink: 0; */
  background-color: ${getBackgroundColor};
  color: ${getColor};
  border: 1px solid ${getBorderColor};
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
`;

const RightContainer = styled.div`
  ${minMedia.desktop`
  width: 50%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  `}
`;

const SaveContainer = styled.div`
  display: flex;
  align-items: center;
  > :first-child {
    margin-right: 5px;
  }
  > :nth-child(3) {
    margin-left: 5px;
  }
`;

const Tiret = styled.div`
  height: 1px;
  background-color: #111827;
  width: 10px;
`;

const SaveButton = styled(QuizzButton)`
  font-size: 0.9em;
`;

const Tip = styled.span`
  font-size: 0.65em;
  font-style: italic;
`;

const TipContainer = styled.div`
  margin-top: -5vh !important;
  margin-bottom: 5vh !important;
  ${media.mobile`
    display: none;
  `}
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  ${media.mobile`
    flex-direction: column;
  `}
`;

const FriendsInput = styled.input`
  padding: 12px 12px;
  border: none;
  border: 1px solid #e5e7eb;
  border-radius: 2px;
  font-size: 16px;
  font-weight: 300;
  &:placeholder {
    color: rgba(17, 24, 39, 0.4);
  }
`;

const InputWithLoader = styled.div`
  display: flex;
  align-items: center;
  padding-right: 12px;
  > div {
    margin-left: -25px;
  }
`;

export default Result;
