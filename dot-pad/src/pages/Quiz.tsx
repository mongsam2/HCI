import React, {useState, useEffect, useRef, useCallback} from 'react';
import { DotPadSDK } from "../DotPadSDK-1.0.0";
import { Device } from "../device";
import { Animal, animalList, AnimalData } from "../util/animalData";
import DotPadDisplay  from '../components/DotPadDisplay'; 
import DotPadButtons  from '../components/DotPadButtons'; 
import '../App.css';



//퀴즈 상태 정의 (어떤 동물이 정답인지, 선택지는 무엇인지)
interface QuizState {
    currentAnimal : Animal | null; // 정답 동물
    options: string[] //선택지 (예 : ["사자", "호랑이", "곰"])
    correctAnswer: string; //정답 동물 이름
    isAnswered: boolean; //사용자가 답을 선택했는지 여부
    isCorrect: boolean; //사용자의 답이 정답인지
    feedbackMessage: string; // <---- 임시 기능
}



// 텍스트를 점자 헥스 코드로 변환하는 함수 (임시)
// 필요한 모든 헥스 코드 animalData.ts에 구현해 사용할 예정
const textToBrailleHex = (text: string): string => {
    if (text.includes("정답")) {
        return "300E360A2303"; // "정답" 예시 헥스
    }
    if (text.includes("오답")) {
        return "250A2303"; // "오답" 예시 헥스
    } 
    if (text.includes("1.") || text.includes("2.") || text.includes("3.")) {
        return "3C08003C18003C09" // 1 2 3
    }
    if (text.includes("연결")) {
        return "0x01020304050607080900"; // "연결" (예시)
    } 
    //기본값
    return "0000000000000000000000000000000000000000"
};



export default function Quiz() {

    //상태 및 Ref 정의
    const dotpadsdk = useRef<DotPadSDK | null>(null);
    const [devices, setDevices] = useState<Device[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [mainDisplayData, setMainDisplayData] = useState<string | null>(null);
    
    //퀴즈 로직을 위한 state
    const [quizState, setQuizState] = useState<QuizState>({
        currentAnimal : null,
        options: [],
        correctAnswer: "",
        isAnswered: false, 
        isCorrect: false,
        feedbackMessage: "Dot Pad 연결"
    });


    // 데이터 처리
    // 3개의 랜덤한 답안 옵션 생성
    function generateOptions(correctAnswer:string) {
        let options = [correctAnswer];
        let animalNames = animalList.map(animal => animal.name); //모든 동물 이름 배열

        // 정답과 다른 2개의 오답을 랜덤으로 뽑기
        while (options.length < 3) {
            const randomIndex = Math.floor(Math.random() * animalNames.length);
            const randomAnimalName = animalNames[randomIndex];

            if (!options.includes(randomAnimalName)) {
                options.push(randomAnimalName);
            }
        }

        // 배열을 무작위로 섞기
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }
        return options;    
    };

    // --- 2. 퀴즈 핵심 로직 함수 ---

    // 새 문제 불러오기
    const loadNewQuestion = useCallback(() => {
        console.log("새 문제 로드 중...");
        const validAnimals = animalList.filter(a => a.name && a.f1); // 이름과 f1 데이터가 있는 동물만
        if (validAnimals.length === 0) {
            console.error("동물 데이터가 없습니다.");
            setQuizState(prev => ({ ...prev, feedbackMessage: "동물 데이터 없음", currentAnimal: null, options: [], correctAnswer: "", isAnswered: false, isCorrect: false }));
            return;
        }
        const randomIndex = Math.floor(Math.random() * animalList.length);
        const correctAnimal = animalList[randomIndex];
        const generatedOptions = generateOptions(correctAnimal.name); 

        setQuizState({
            currentAnimal: correctAnimal,
            options: generatedOptions,
            correctAnswer: correctAnimal.name,
            isAnswered: false,
            isCorrect: false,
            feedbackMessage: "무슨 동물일까요? 1. 2. 3."
        });
    }, []);

    // 정답 확인 로직
    const handleAnswer = async (selectedAnswer: string) => {
        if (quizState.isAnswered) return; // 이미 답을 선택했으면 무시

        const isCorrect = (selectedAnswer === quizState.correctAnswer);
        let feedbackText = "";
        let feedbackHex = ""; // 점자용 헥스 코드

        if (isCorrect) {
            feedbackText = `정답! ${quizState.correctAnswer}. F1-F3로 다른 모습을 보세요`;
            feedbackHex = textToBrailleHex("정답"); // TODO: "정답" 메시지 헥스값
    
        // 정답 상태로 변경
        setQuizState(prevState => ({
            ...prevState,
            isAnswered: true, // 정답을 맞췄으므로 상태 변경
            isCorrect: true,
            feedbackMessage: feedbackText, 
        }));
    
        } else {
            // 오답일 경우
            feedbackText = `땡! ${selectedAnswer}는 오답입니다. 다시 시도하세요.`;
            //feedbackHex = textToBrailleHex("오답"); // TODO: "오답" 메시지 헥스값
    
            // isAnswered를 true로 바꾸지 않음 (다시 시도해야 하므로)
            setQuizState(prevState => ({
                ...prevState,
                isCorrect: false, // 오답 플래그 (필요하다면)
                feedbackMessage: feedbackText, // 화면 UI에만 "오답" 표시
            }));
        }
    };


    // --- 3. 닷패드 관련 함수 (Test.tsx) ---

    // 닷패드 키패드 입력 처리
    const dotpadKeyCallback = useCallback(async (keyCode: string) => {
        console.log("=> 닷패드 키 입력: " + keyCode);

        const { currentAnimal, options, isAnswered, isCorrect } = quizState;
        
        if (!currentAnimal || !connectedDevice || !dotpadsdk.current) return; // 퀴즈 시작 전이거나 기기 연결 안되면 무시
        
        if (quizState.isAnswered) { //상태 2: 정답을 맞춘 후
            switch (keyCode) {
                case 'F1':
                    await dotpadsdk.current.displayGraphicData(connectedDevice.target, currentAnimal.f1);
                    setMainDisplayData(currentAnimal.f1); // 웹 UI 업데이트
                    break;
                case 'F2':
                    if (currentAnimal.f2) {
                    await dotpadsdk.current.displayGraphicData(connectedDevice.target, currentAnimal.f2);
                    setMainDisplayData(currentAnimal.f2);
                    }
                    break;
                case 'F3':
                    if (currentAnimal.f3) {
                    await dotpadsdk.current.displayGraphicData(connectedDevice.target, currentAnimal.f3);
                    setMainDisplayData(currentAnimal.f3);
                    }
                    break;
                case 'next': // 'right' 또는 'RightArrow' (SDK 확인 필요)
                    loadNewQuestion();
                    break;
                case 'F4':
                    console.log("퀴즈 종료");
                    // navigate('/'); // (react-router-dom을 사용한다면)
                    break;
                default:
                    // 다른 키(Left, F1, F2, F3)는 정답 맞춘 후엔 무시
                    break;
            }
        } else { //상태 1: 정답 맞추기 전
            switch (keyCode) {
                case 'F1':
                    if (options[0]) handleAnswer(options[0]);
                    break;
                case 'F2':
                    if (options[1]) handleAnswer(options[1]);
                    break;
                case 'F3':
                    if (options[2]) handleAnswer(options[2]);
                    break;
                case 'next': // 다음 문제로 넘어가는 기능 (활성화 여부 확인)
                    // isAnswered가 false일 땐 동작하지 않아야 함. (위의 if (isAnswered) 블록에만 있음)
                    break;
                case 'F4':
                    console.log("퀴즈 종료");
                    // navigate('/'); 
                    break;
                default:
                    break;
            }
        }
    }, [quizState, connectedDevice, loadNewQuestion, handleAnswer]); // 의존성 배열 업데이트
       
    useEffect(() => {
        if (connectedDevice) {
            console.log("기기가 연결되었습니다. 첫 문제를 로드합니다.");
            loadNewQuestion();
        }
    }, [connectedDevice, loadNewQuestion]); // connectedDevice나 loadNewQuestion이 변경될 때 실행

    // SDK 초기화 (페이지 로드 시 1회)
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
            setConnectedDevice(device);
          }
        } else {
          await dotpadsdk.current?.disconnect(device.target);
          setConnectedDevice(null);
        }
        setDevices((devices) =>
          devices.map((d) => (d.name === device.name ? { ...d, connected } : d))
        );
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

    // 닷패드 없이 웹 UI 테스트를 위한 함수
    const handleStartTestMode = () => {
        console.log("Starting Test Mode...");
        const mockDevice = {
            target: "mock-device" as any,
            name: "Test Device",
            connected: true,
        } as Device;
        setConnectedDevice(mockDevice);
        
        setDevices([mockDevice]);
    };


    // --- 5. UI 렌더링 ---
    return (
        <div className="quiz-container"
            style={{ color: 'black', backgroundColor: 'white', padding: '20px', border: '5px solid red' }}>
            <h2>동물 퀴즈</h2>
            
            {/* ... (기기 연결 UI는 동일) ... */}

            <hr /> 

            {/* ✅ [추가] 테스트 모드 시작 버튼 */}
            {!connectedDevice && (
                <div style={{ padding: '20px' }}>
                    <p>실물 닷패드 기기가 없으신가요?</p>
                    <button className="button" onClick={handleStartTestMode}>
                        웹 UI 테스트 모드 시작
                    </button>
                </div>
            )}

            {/* 퀴즈 디스플레이 영역 */}
            {connectedDevice && quizState.currentAnimal ? (
                <div className="quiz-area">
                <DotPadDisplay 
                mainData={quizState.isAnswered && !quizState.isCorrect ? "" : (quizState.currentAnimal?.f1 || "")} 
                subData={textToBrailleHex(
                    !quizState.isAnswered 
                    ? quizState.options.map((opt, i) => `${i + 1}.${opt}`).join(' ') 
                    // 나중에 정확한 부위 명칭 매핑 필요
                    : `1. ${quizState.currentAnimal?.pose1 || '옆모습'} 2. ${quizState.currentAnimal?.pose2 || '얼굴'} 3. ${quizState.currentAnimal?.pose3 || '발자국'}`
                )}
            />
                
                {/* 사용자 컨트롤 영역 (웹 UI 버튼) */}
                <div className="controls-area">
                <p>{quizState.feedbackMessage}</p> {/* 화면에 텍스트 피드백 */}
                
                {!quizState.isAnswered ? (
                    // 상태 1: 답 선택 전
                    <div className="options-container">
                    {quizState.options.map((option, index) => (
                        <button key={index} className="button" onClick={() => handleAnswer(option)}>
                        F{index + 1}: {option}
                        </button>
                    ))}
                    </div>
                ) : (
                    // 상태 2: 답 선택 후
                    <div className="next-question-container">
                    {quizState.isCorrect ? (
                        // 정답 맞췄을 때
                        <>
                        <button className="button" onClick={() => dotpadKeyCallback('F1')}>
                            {quizState.currentAnimal.pose1 || '포즈 1'}
                        </button>
                        <button className="button" onClick={() => dotpadKeyCallback('F2')}>
                            {quizState.currentAnimal.pose2 || '포즈 2'}
                        </button>
                        <button className="button" onClick={() => dotpadKeyCallback('F3')}>
                            {quizState.currentAnimal.pose3 || '포즈 3'}
                        </button>
                        <button className="button" onClick={() => dotpadKeyCallback('Right')}>
                            다음 문제 (→)
                        </button>
                        </>
                    ) : (
                        // 오답일 때 (다시 시도 버튼 없음 -> '다음 문제' 버튼만 있음)
                        <button className="button" onClick={loadNewQuestion}>
                        다음 문제 (→)
                        </button>
                    )}
                    </div>
                )}
                <button className="button" onClick={() => dotpadKeyCallback('F4')}>종료 (F4)</button>
                </div>
            </div>
            ) : (
            <p>Dot Pad를 연결해주세요. 퀴즈가 시작됩니다.</p>
            )}

            {/* DotPad 물리적 버튼 매핑 (UI 없이 기능만) */}
            {connectedDevice && (
            <DotPadButtons 
                onArrowButtonClick={(key) => dotpadKeyCallback(key.charAt(0).toUpperCase() + key.slice(1))} // 'left'/'right' -> 'Left'/'Right'
                onFunctionButtonClick={(key) => dotpadKeyCallback(key.toUpperCase())} // 'f1' -> 'F1'
            />
            )}
        </div>
        
    );
        
    
}