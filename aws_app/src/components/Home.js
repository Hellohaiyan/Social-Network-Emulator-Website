import React from "react";
import Image from 'react-bootstrap/Image';

import Waterfall from "../images/temp.png"


export function Home() {
  const imageStyle = {
    maxWidth: '100%',
    height: 'auto',
    objectFit: 'contain'
  };
  const containerStyle = {
    height: '700px',
    overflow: 'hidden'
  };

  return (
    <div style={containerStyle}>
      <Image src={Waterfall} style={imageStyle} />
    </div>
  );
}
