// src/pages/about.tsx

import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';

export default function About() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>About - TypoFold</title>
        <meta name="description" content="About TypoFold project" />
      </Head>

      {/* aboutContainer */}
      <div
        className="relative flex flex-col justify-center items-center w-screen h-fit px-10 py-20 gap-10"
        style={{ background: 'linear-gradient(#750cff 0%, #ffffff 20%)' }}
      >
        {/* header */}
        <div className="fixed top-0 left-0 w-full px-[30px] py-[15px] flex flex-row justify-between items-center z-[100]">
          <button
            className="w-fit h-[50px] font-light text-[40px] leading-normal bg-gradient-to-r from-[#B499F5] via-[#848BCB] to-[#5898A0] bg-clip-text text-transparent cursor-pointer hover:opacity-50 transition-opacity"
            style={{ WebkitTextFillColor: 'transparent', WebkitBackgroundClip: 'text' }}
            onClick={() => router.push('/')}
          >
            TypoFold
          </button>
          <button
            className="flex justify-center items-center w-fit h-fit py-2 cursor-pointer text-[20px] font-light hover:opacity-50 transition-opacity"
            onClick={() => router.push('/')}
          >
            Go Back
          </button>
        </div>

        {/* row */}
        <div className="w-full h-fit relative flex flex-row justify-center items-center gap-[10px]">
          <div className="w-1/2 h-fit object-contain">
            <div className="relative bg-white" style={{ paddingTop: '56.25%' }}>
              <iframe
                src="https://player.vimeo.com/video/1031770589?autoplay=1&loop=1&title=0&background=1"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
                className="absolute top-0 left-0 w-full h-full"
                title="TypoFold"
              />
            </div>
          </div>

          <Image
            src="/img/cute.png"
            alt="group"
            width={500}
            height={500}
            className="w-[42%] h-fit object-contain"
          />
        </div>

        {/* projectInfo */}
        <div className="w-full h-fit flex flex-col justify-start items-start gap-1">
          <span className="font-light text-[20px] leading-normal text-black">About Project</span>
          <p className="font-extralight text-[16px] leading-relaxed text-black">
            {'<'}TypoFold{'>'} was designed to connect digital typography and analog sculpture. The idea
            is to apply texture images created using p5.js in a digital environment to a 3D typography
            model, and then convert it into a paper blueprint to create a physical sculpture that can be
            assembled in the real world. This is important because it means that digital creations
            don&apos;t just stay on the screen, but can actually be manifested in a form that can be
            touched and assembled by hand. As a result of the project, users will be able to print out
            textures and 3D typography directly from the web and assemble them on paper, creating the
            same three-dimensional artwork as their digital counterparts.
          </p>
        </div>

        <div className="w-full h-fit flex flex-col justify-start items-start gap-1">
          <span className="font-light text-[20px] leading-normal text-black">
            What inspired you to create your work?
          </span>
          <p className="font-extralight text-[16px] leading-relaxed text-black">
            I was motivated by the fact that code-based design tools like p5.js are not being applied to
            the design field outside of media arts. I was trying to turn my previous work in p5.js into
            3D merchandise, and it was very difficult. Programs like Adobe&apos;s Illustrator make it
            easy to create designs, but p5.js only allows you to capture screenshots, so it took a lot
            of effort to convert them into schematics.
            <br />
            <br />
            So I thought, &quot;It would be great if there was a website where you could put a 3D object
            on the website and it would automatically create a schematic for you.&quot; I wanted to
            connect it with p5.js so that you could create a 3D schematic of a graphic that changes in
            real time.
            <br />
            <br />
            For example, if you create an &apos;A&apos; with typography, it will give you the shape, add
            faces to it, make it 3D, and convert it into a fold. The main reason I created {'<'}TypoFold
            {'>'} was because I thought it would be easy to use. I hope that people who see this project
            will be able to use it and have fun in the process.
          </p>
        </div>

        <Image
          src="/img/group.png"
          alt="group"
          width={1200}
          height={800}
          className="w-full h-fit flex justify-center items-center"
        />
      </div>
    </>
  );
}