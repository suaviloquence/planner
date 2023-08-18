#[macro_use]
extern crate rocket;

use std::fs;

use rocket::{
	response::content::{RawHtml, RawJavaScript},
	routes,
};

#[get("/")]
pub fn serve_app() -> RawHtml<fs::File> {
	RawHtml(fs::File::open("../index.html").expect("error opening index.html"))
}

#[get("/planner.js")]
pub fn serve_script() -> RawJavaScript<fs::File> {
	RawJavaScript(fs::File::open("../app/bin/planner.js").expect("error opening planner.js"))
}

#[launch]
fn rocket() -> _ {
	rocket::build().mount("/", routes![serve_app, serve_script])
}
