import { useEffect, useRef, useState } from "react";
import { DotPadSDK } from "../DotPadSDK-1.0.0";
import { Device } from "../device";
import "../App.css";

import DotPadDisplay from "../components/DotPadDisplay";  // Demo.tsx에서 가져옴




export default function Dictionary() {
  
  const dotpadsdk = useRef<DotPadSDK>(null);
  const [devices, setDevices] = useState<Device[]>([]);

  // 그림판에 표시할 데이터 상태 정의 (main : 그림용, sub : 텍스트용)
  const [mainDisplayData, setMainDisplayData] = useState<String>(""); //그래픽용
  const [subDisplayData, setSubDisplayData] = useState<String>(""); // 텍스트용


  useEffect(() => { //페이지가 켜질 때 딱 한 번 실행
    console.log("Dictionary 페이지 로드됨, SDK 초기화 시작") //디버깅용 로그

    dotpadsdk.current = new DotPadSDK();    // SDK  인스턴스 생성
    console.log("SDK 인스턴스 생성 완료:", dotpadsdk.current);

  }, []);


  // dot_files/birds.dtms 의 펭귄 데이터 사용
  const penguinImageData = "0000000f000000000000008064321199992bc608000000000000f00000000000000f000000000000e01300e813d9dcb18eef8c0000000000f00000000000000f000000000000f000009f00301200b13f130100000000f00000000000000f0000000000c8160000f806000044f608000000000000f00000000000000f00000000e0030000ec0100000000103f8e0000000000f00000000000000f00000000df0400800f000000000000f7f00c00000000f00000000000000f000000e81300807c01000000000000f000c708000000f00000000000000f00000047cc6413cf000000000000007e624435000000f00000000000000f000000c0368e00308e0000000000f803000000000000f00000000000000f000000101111634454eeaeee26737577000000000000f0000000";
  const penguinTextData = "1000000000000000000000000000000000000000";




  // 그래픽 출력 테스트 함수
  const handlePrintImage = async () => {
    console.log("펭귄 이미지 출력");
    const targetDevice = devices[0];

    // if (dotpadsdk.current && targetDevice) {      << 실제 패드 연결 시 사용
    if (dotpadsdk.current) {
      setMainDisplayData(penguinImageData); // 이미지 데이터 상태를 펭귄 이미지 데이터로 변경
      setSubDisplayData(""); 
    }
    
    // ****** 실제 패드 연결시 사용할 부분 *****
    // if (dotpadsdk.current && targetDevice) {
    //   //Test.tsx의 이미지 출력 함수 사용
    //   await dotpadsdk.current?.displayGraphicData(targetDevice, penguinImageData); // SDK text 출력 코드

    // } else {
    //   handlePrintError();
    // }

  };




  // 설명글 출력 테스트 함수
  const handlePrintText = async () =>  {
    console.log("펭귄 설명글 출력");
    const targetDevice = devices[0];

    // if (dotpadsdk.current && targetDevice) {      << 실제 패드 연결 시 사용
    if (dotpadsdk.current) {
      setMainDisplayData(""); 
      setSubDisplayData(penguinTextData);  // 텍스트 데이터 상태를 펭귄 텍스트 데이터로 변경
    }
    
    // ****** 실제 패드 연결시 사용할 부분 *****
    // if (dotpadsdk.current && targetDevice) {
    //   //Test.tsx의 설명글 출력 함수 사용
    //   await dotpadsdk.current?.displayTextData(targetDevice, penguinTextData); // SDK text 출력 코드

    // } else {
    //   handlePrintError();
    // }

  };

  const handlePrintError = () => {
    console.error("기기를 못 찾음");
    alert("기기를 먼저 연결하세요.")
  }

  



// --------------test.tsx 에서 필요한 함수 가져옴------------------

  useEffect(() => {
    dotpadsdk.current = new DotPadSDK();
  }, []);

  const updateDeviceConnection = async (device: any, connected: any) => {
    if (connected) {
      const isConnected = await dotpadsdk.current?.connect(device.target);
      if (isConnected) {
        await dotpadsdk.current?.addListenerKeyEvent(
          device.target,
          dotpadKeyCallback
        );
      }
    } else {
      await dotpadsdk.current?.disconnect(device.target);
    }
    setDevices((devices) =>
      devices.map((d) => (d.name === device.name ? { ...d, connected } : d))
    ); // 객체에서 connected만 변경
  };

  // Function to select a DotPad device
  const handleSelectDevice = async () => {
    const device = await dotpadsdk.current?.request(); // 브라우저 창을 띄워서 DotPad 블루투스 장치를 선택하게 한 다음, 선택된 장치 객체를 반환
    const deviceInfo = {
      target: device,
      name: device.name,
      connected: false,
    };
    setDevices((currentDevices) => [...currentDevices, deviceInfo]);
  };
 
  // DotPad function key callback
  const dotpadKeyCallback = async (keyCode: string) => {
    console.log("=> dotpad key code : " + keyCode);
  };
//----------------------------------------------------------------------

  






  return (
    <div>
      <h1>Dictionary Page</h1>
      <div className="tableContainer">
        <div className="buttonContainer">
          <button className="selectButton" onClick={handleSelectDevice}>
            Select DotPad
          </button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th className="header">DotPad Name</th>
              <th className="header">Connect/Disconnect</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device.name} className="row">
                <td className="cell">{device.name}</td>
                <td className="cell">
                  {!device.connected && (
                    <button
                      className="button"
                      onClick={() => updateDeviceConnection(device, true)}
                    >
                      Connect
                    </button>
                  )}
                  {device.connected && (
                    <button
                      className="button"
                      onClick={() => updateDeviceConnection(device, false)}
                    >
                      Disconnect
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>



      {/* Dictionary page content goes here */}
      <hr /> {/* ... */}
      <h2>SDK 기능 테스트 영역 (JSON + 화면 출력)</h2>

      <p>동물 : 펭귄</p>

      <button onClick = {handlePrintImage}>
        펭귄 이미지 출력 테스트
      </button>

      <button onClick = {handlePrintText}>
        펭귄 텍스트 출력 테스트
      </button>

      {/* 그림판 컴포넌트 추가 */}
      <div style={{ marginTop: '20px', border: '1px solid lightgray', padding : '10px'}}>
        <h3> 화면 미리보기 (Demo) : </h3>
        <DotPadDisplay mainData={String(mainDisplayData)} subData={String(subDisplayData)} />
      </div>

    </div>
  );
}