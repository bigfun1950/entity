import maxmind from "maxmind";
import path from "path";

const countryDbPath = path.join(process.cwd(), "src/lib/EntityDB/EntityCountry.mmdb");
const asnDbPath = path.join(process.cwd(), "src/lib/EntityDB/EntityAsn.mmdb");

let countryLookupPromise;
let asnLookupPromise;

async function getCountryLookup() {
    if (!countryLookupPromise) {
        countryLookupPromise = maxmind.open(countryDbPath);
    }
    return countryLookupPromise;
}

async function getAsnLookup() {
    if (!asnLookupPromise) {
        asnLookupPromise = maxmind.open(asnDbPath);
    }
    return asnLookupPromise;
}

export async function getCountry(ip) {
    const lookup = await getCountryLookup();
    return lookup.get(ip)?.country?.iso_code || "UNKNOWN";
}

export async function getAsn(ip) {
    const lookup = await getAsnLookup();
    return lookup.get(ip) || null;
}
