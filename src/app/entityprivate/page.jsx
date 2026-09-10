import CustomCursor from "./main/CutomCursor";

const { default: MainPage } = require("@/app/entityprivate/main/MainPage");

export const metadata = {
	title: "ENTITY BOUNCE VALIDATOR",
};

function VALIDATORHOME() {
	return (
		<>
			<CustomCursor />
			<MainPage />
		</>
	);
}

export default VALIDATORHOME;
