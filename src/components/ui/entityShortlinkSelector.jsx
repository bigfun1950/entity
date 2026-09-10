import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectValue,
} from "@/components/ui/select";

export function AllowedDeviceSelect({ value, onChange }) {
	return (
		<div>
			<label
				htmlFor="allowed-device"
				className="block text-xs font-semibold mb-1 ml-1 dark:text-white/50 text-black/70"
			>
				Allowed Device
			</label>
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger
					id="allowed-device"
					className="w-full bg-white border-neutral-500"
				>
					<SelectValue placeholder="Select device" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="desktop">Desktop Only</SelectItem>
					<SelectItem value="mobile">Mobile Only</SelectItem>
					<SelectItem value="both">Allow Both</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}

export function AllowedCountrySelect({ value, onChange }) {
	return (
		<div>
			<label
				htmlFor="allowed-country"
				className="block text-xs font-semibold mb-1 ml-1 dark:text-white/50 text-black/70"
			>
				Allowed Country
			</label>
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger
					id="allowed-country"
					className="w-full bg-white border-neutral-500"
				>
					<SelectValue placeholder="Select country" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">Allow All</SelectItem>

					<SelectItem value="US">United States</SelectItem>
					<SelectItem value="GB">United Kingdom</SelectItem>
					<SelectItem value="CA">Canada</SelectItem>
					<SelectItem value="AU">Australia</SelectItem>
					<SelectItem value="NZ">New Zealand</SelectItem>
					<SelectItem value="SG">Singapore</SelectItem>
					<SelectItem value="HK">Hong Kong</SelectItem>
					<SelectItem value="JP">Japan</SelectItem>
					<SelectItem value="KR">South Korea</SelectItem>
					<SelectItem value="DE">Germany</SelectItem>
					<SelectItem value="FR">France</SelectItem>
					<SelectItem value="IT">Italy</SelectItem>
					<SelectItem value="ES">Spain</SelectItem>
					<SelectItem value="NL">Netherlands</SelectItem>
					<SelectItem value="SE">Sweden</SelectItem>
					<SelectItem value="NO">Norway</SelectItem>
					<SelectItem value="DK">Denmark</SelectItem>
					<SelectItem value="FI">Finland</SelectItem>
					<SelectItem value="CH">Switzerland</SelectItem>
					<SelectItem value="BE">Belgium</SelectItem>
					<SelectItem value="AT">Austria</SelectItem>
					<SelectItem value="IE">Ireland</SelectItem>
					<SelectItem value="AE">United Arab Emirates</SelectItem>
					<SelectItem value="SA">Saudi Arabia</SelectItem>
					<SelectItem value="QA">Qatar</SelectItem>
					<SelectItem value="KW">Kuwait</SelectItem>
					<SelectItem value="BH">Bahrain</SelectItem>
					<SelectItem value="IN">India</SelectItem>
					<SelectItem value="ID">Indonesia</SelectItem>
					<SelectItem value="MY">Malaysia</SelectItem>
					<SelectItem value="TH">Thailand</SelectItem>
					<SelectItem value="PH">Philippines</SelectItem>
					<SelectItem value="VN">Vietnam</SelectItem>
					<SelectItem value="CN">China</SelectItem>
					<SelectItem value="BR">Brazil</SelectItem>
					<SelectItem value="MX">Mexico</SelectItem>
					<SelectItem value="AR">Argentina</SelectItem>
					<SelectItem value="ZA">South Africa</SelectItem>
					<SelectItem value="NG">Nigeria</SelectItem>
					<SelectItem value="KE">Kenya</SelectItem>
					<SelectItem value="EG">Egypt</SelectItem>
					<SelectItem value="TR">Turkey</SelectItem>
					<SelectItem value="PL">Poland</SelectItem>
					<SelectItem value="CZ">Czech Republic</SelectItem>
					<SelectItem value="HU">Hungary</SelectItem>
					<SelectItem value="RO">Romania</SelectItem>
					<SelectItem value="GR">Greece</SelectItem>
					<SelectItem value="PT">Portugal</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}

export function BotRedirectionSelect({ value, onChange }) {
	return (
		<div>
			<label
				htmlFor="bot-redirection"
				className="block text-xs font-semibold mb-1 ml-1 dark:text-white/50 text-black/70"
			>
				Bot Redirection
			</label>
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger
					id="bot-redirection"
					className="w-full bg-white border-neutral-500"
				>
					<SelectValue placeholder="Select action" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="400">400 Bad Request</SelectItem>
					<SelectItem value="401">401 Unauthorized</SelectItem>
					<SelectItem value="403">403 Forbidden</SelectItem>
					<SelectItem value="404">404 Not Found</SelectItem>
					<SelectItem value="500">500 Server Error</SelectItem>
					<SelectItem value="random">Redirect to Random URL</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}
