import { NextResponse } from "next/server";
import { getUserId } from "../../../lib/userId";
import { getMorningMessage } from "../../../lib/getMorningMessage";


export async function GET() {
const userId = getUserId();


if (!userId) {
return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
}


const message = await getMorningMessage(userId);


return NextResponse.json({ message });
}


// -----------------------------------------------------
// 3. OPCJONALNE WYWOŁANIE Z FRONTU
// -----------------------------------------------------


/*
const res = await fetch("/api/day/morning");
const data = await res.json();


if (data.message) {
// pokaż na górze czatu / dashboardu
console.log(data.message);
}
*/