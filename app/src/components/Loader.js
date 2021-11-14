import React, { useEffect, useRef, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import logo from "../images/logo.svg";

const transitionInMillisec = 1000;

const Loader = ({
  isLoading,
  size = "15vh",
  withBackground = false,
  withLogoBorder = false,
  displayOnLoadingOnly = false,
}) => {
  const [showLogoLoading, setShowLogoLoading] = useState(false);
  const [showLogoKey, setShowLogoKey] = useState(false);

  const loadingIntervalRef = useRef(null);

  const keepLoadingInterval = () => {
    loadingIntervalRef.current = setInterval(
      () => setShowLogoKey((k) => k + 1),
      transitionInMillisec / 2
    );
  };

  useEffect(() => {
    if (isLoading && !showLogoLoading) {
      setShowLogoLoading(true);
      keepLoadingInterval();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  useEffect(() => {
    if (showLogoLoading && !isLoading) {
      setShowLogoLoading(false);
      clearInterval(loadingIntervalRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLogoKey]);

  if (!withBackground)
    return (
      <Logo
        size={size}
        displayOnLoadingOnly={displayOnLoadingOnly}
        withLogoBorder={withLogoBorder}
        className={!!showLogoLoading && "animate"}
      />
    );
  return (
    <BackgroundContainer showLogoLoading={showLogoLoading}>
      <Logo
        size={size}
        withLogoBorder={withLogoBorder}
        displayOnLoadingOnly={displayOnLoadingOnly}
        className={!!showLogoLoading && "animate"}
      />
    </BackgroundContainer>
  );
};

const opacityCss = css`
  opacity: 1;
  transition: none;
  cursor: wait;
  pointer-events: auto;
`;

const BackgroundContainer = styled.div`
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #111827;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: opacity 250ms ease-in-out;
  pointer-events: none;
  opacity: 0;
  ${(props) => props.showLogoLoading && opacityCss}
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
`;

const Logo = styled.div`
  height: ${(props) => props.size};
  width: ${(props) => props.size};
  border-radius: ${(props) => props.size};
  background-image: url(${logo});
  background-size: cover;
  background-repeat: no-repeat;
  border: none;
  ${(props) => props.withLogoBorder && "border: 1px solid #111827;"}
  ${(props) => props.displayOnLoadingOnly && "visibility: hidden;"}
  &.animate {
    ${(props) => props.displayOnLoadingOnly && "visibility: visible;"}
    animation: ${rotate} ${transitionInMillisec}ms linear infinite;
  }
`;

export default Loader;
