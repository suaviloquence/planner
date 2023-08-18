use std::fs;

use rocket::{fs::FileServer, response::content::RawHtml, routes};

#[rocket::get("/<_..>", rank = 5)]
pub fn serve_app() -> RawHtml<fs::File> {
    RawHtml(fs::File::open("../public/index.html").expect("error opening index.html"))
}

#[rocket::launch]
fn rocket() -> _ {
    rocket::build()
        .mount("/public", FileServer::from("../public").rank(1))
        .mount("/", routes![serve_app])
}
