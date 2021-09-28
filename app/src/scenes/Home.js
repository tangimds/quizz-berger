import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { media } from "../styles/mediaQueries";

import Header from "../components/Header";

class Home extends React.Component {
  render() {
    return (
      <>
        <Header {...this.props} />
        <BackgroundContainer>
          <Container>
            <Title>Know where you actually take a stand</Title>
            <SubTitle>
              Take our Political Compass test to find out which political group
              your best match is
            </SubTitle>
            <Link to='/theme'>
              <QuizzButton>
                <span>Take the test now</span>
              </QuizzButton>
            </Link>
          </Container>
        </BackgroundContainer>
      </>
    );
  }
}

const BackgroundContainer = styled.div`
  padding: 40px 20px;
  min-height: calc(100vh - 80px);
  background-color: #111827;
  display: flex;
  align-items: center;
  justify-content: center;
  ${media.mobile`
  min-height: calc(100vh - 11vh);
  `}
`;

const Container = styled.div`
  width: 770px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Title = styled.h2`
  margin-bottom: 20px;
  font-family: Merriweather;
  font-style: normal;
  font-weight: bold;
  font-size: 48px;
  line-height: 150%;
  text-align: center;
  color: #ffffff;
  ${media.mobile`
  font-size: 44px;
`}
`;

const SubTitle = styled.h3`
  margin-bottom: 40px;
  font-family: Merriweather Sans;
  font-style: normal;
  font-weight: 300;
  font-size: 20px;
  line-height: 200%;
  text-align: center;
  color: #ffffff;
  opacity: 0.8;
`;

const QuizzButton = styled.button`
  width: 240px;
  height: 65px;
  background: #facc15;
  border-radius: 55px;
  border: none;
  font-family: Merriweather Sans;
  font-weight: 600;
  font-size: 16px;
  color: #111827;
  cursor: pointer;
`;

export default Home;
