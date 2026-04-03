"use client";

import Image from "next/image";

type Props = {

  heading: string;
  description: string;
  image: string;
  reverse?: boolean;
  
};

export default function CollectionSection({

  heading,
  description,
  image,
  reverse = false,
}: Props) {
  return (
    <section className={`collection ${reverse ? "reverse" : ""}`}>
      {/* IMAGE */}
      <div className="image-box">
        <Image src={image} alt={heading} width={400} height={500} />
      </div>

      {/* TEXT */}
      <div className="text-box">

        <h2>{heading}</h2>
        <p>{description}</p>
        <div className="divider" />

       
      </div>
    </section>
  );
}