import React, { useContext } from "react";
import styled from "styled-components";
import UserContext from "../contexts/user";
import API from "../services/api";

import Button from "./Button";
import Modal from "./Modal";

const ShareModal = ({ isActive, onCloseModal }) => {
  const { user, setUser } = useContext(UserContext);

  const onEnablePublicLink = async () => {
    const response = await API.put({ path: "user", body: { isPublic: true } });
    if (!response.ok) return alert(response.error);
    setUser(response.data);
  };

  const publicLink = `https://partage.quizz-du-berger.com/result/${user?.pseudo}`;

  return (
    <Modal center isActive={isActive} onCloseModal={onCloseModal} title="Partagez vos résultats">
      <span>
        Quand vous aurez cliqué sur le bouton ci-dessous, toute personne avec ce lien pourra voir
        ces résultats
      </span>
      {!user?.isPublic ? (
        <Button onClick={onEnablePublicLink}>J'ai compris, afficher le lien</Button>
      ) : (
        <>
          <PublicLink href={publicLink} target="_blank">
            {publicLink}
          </PublicLink>
          <Button>Ne plus partager ces résultats</Button>
        </>
      )}
    </Modal>
  );
};

const PublicLink = styled.a`
  margin-bottom: 20px;
  font-family: Merriweather Sans;
  font-style: normal;
  font-weight: 500;
  line-height: 1.5em;
  text-align: center;
  text-decoration: underline;
  cursor: pointer;
`;

export default ShareModal;