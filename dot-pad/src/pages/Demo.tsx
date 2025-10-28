import React from "react";
import DotPadDisplay from "../components/DotPadDisplay";
import DotPadButtons from "../components/DotPadButtons";
import { AnimalData, animalList } from "../util/animalData";

const Demo = () => {
  const subData = "000220000220000220000220000220000220";
  const sampleDataTwo =
    "d00000000000f000000080440200000000000000000000000000000000000000000000800700002c010000000000000000000000000000000000000008000000003c00801600000000000000000000000000000000808888884800000000e001001e00000000000000008088442422221111110100000000000000808f88e889484444444422221101000000000000000000000000000010113d0000004308000000000000000000000000000000000000000000000000c30000000010428408000000000000000000000000000000000000000000102244880000000010214284080000000000000000000000000000000000000000000f00000000000000102184000000000000000000000000000000000000000f00000000000000000000030000000000000000000000"
  
  const [animalIdx, setAnimalIdx] = React.useState<number>(0);
  const [buttonName, setButtonName] = React.useState<"f1" | "f2" | "f3" | "f4">("f1");

  const onFunctionButtonClick = (buttonName: "f1" | "f2" | "f3" | "f4") => {
    setButtonName(buttonName);
  }

  const onArrowButtonClick = (buttonName: "prev" | "next") => {
    if (buttonName === "prev") {
      setAnimalIdx((prev) => (prev-1+4)%animalList.length)
    } else {
      setAnimalIdx((prev) => (prev+1)%animalList.length)
    }
  };

  const mainData = AnimalData({animalIdx: animalIdx, buttonName: buttonName});

    return (
    <div className="App">
      <h2>Dot Pad Display Test</h2>
      <DotPadDisplay mainData={mainData} subData={subData} />
      <DotPadButtons onArrowButtonClick={onArrowButtonClick} onFunctionButtonClick={onFunctionButtonClick} />
    </div>
  );
};

export default Demo;