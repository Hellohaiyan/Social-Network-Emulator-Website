import React from "react";
import Image from 'react-bootstrap/Image';
import AWS from "../images/AWS.png"


export function Home() {
  const imageStyle = {
    maxWidth: '100%',
    maxHeight: '100%'
  };

  return (
    <div>
      <Image src={AWS} style={imageStyle} />
    </div>
  );
}
