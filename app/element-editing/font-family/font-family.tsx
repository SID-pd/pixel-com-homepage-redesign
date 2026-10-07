import './font-family.css';

const FontFamily = ({ selectedFont, selectedfont }: any) => {
  const fontFamilies = [
    { id: "Arial", name: "Arial", classname: "ff-Arial", fontFamily: "Arial" },
    { id: "Merriweather", name: "Merriweather", classname: "ff-Merriweather", fontFamily: "Merriweather" },
    { id: "Playfair", name: "Playfair", classname: "ff-Playfair", fontFamily: "Playfair Display" },
    { id: "Lora", name: "Lora", classname: "ff-Lora", fontFamily: "Lora" },
    { id: "Roboto", name: "Roboto", classname: "ff-Roboto", fontFamily: "Roboto" },
    { id: "OpenSans", name: "Open-Sans", classname: "ff-Open-Sans", fontFamily: "Open Sans" },
    { id: "poppins-regular", name: "Poppins", classname: "ff-poppins-regular", fontFamily: "Poppins" },
    { id: "Montserrat", name: "Montserrat", classname: "ff-Montserrat", fontFamily: "Montserrat" },
    { id: "Dancing-script", name: "Dancing Script", classname: "ff-Dancing-script", fontFamily: "Dancing Script" },
    { id: "Pacifico", name: "Pacifico", classname: "ff-Pacifico", fontFamily: "Pacifico" },
    { id: "great-vibes", name: "Great Vibes", classname: "ff-great-vibes", fontFamily: "Great Vibes" },
    { id: "fredoka", name: "Fredoka", classname: "ff-fredoka", fontFamily: "Fredoka" },
    { id: "chewy", name: "Chewy", classname: "ff-chewy", fontFamily: "Chewy" },
    { id: "baloo", name: "Baloo", classname: "ff-baloo", fontFamily: "Baloo 2" },
    { id: "gloria-hallelujah", name: "Gloria Hallelujah", classname: "ff-gloria-hallelujah", fontFamily: "Gloria Hallelujah" },
    { id: "source-sans", name: "Source Sans", classname: "ff-source-sans", fontFamily: "Source Sans 3" },
    { id: "ibm-plex-sans", name: "IBM Plex Sans", classname: "ff-ibm-plex-sans", fontFamily: "IBM Plex Sans" },
    { id: "work-sans", name: "Work Sans", classname: "ff-work-sans", fontFamily: "Work Sans" },
    { id: "bungee", name: "Bungee", classname: "ff-bungee", fontFamily: "Bungee" },
    { id: "rubik-moonrocks", name: "Rubik Moonrocks", classname: "ff-rubik-moonrocks", fontFamily: "Rubik Moonrocks" },
    { id: "Monoton", name: "Monoton", classname: "ff-monoton", fontFamily: "Monoton" },
  ];

  const handleFontSelect = (font: any) => {
    selectedfont({ font, forall: false });
  };


  const applyToAll = () => {
    if (selectedFont) {
      selectedfont({ font: selectedFont, forall: true });
    }
  };

  return (
    <div>
      <div className="row">
        <div className="col-12" onClick={applyToAll}>
          <a href="#">Apply fonts to all</a>
        </div>
      </div>
      <div className="row text-fontfamily p-2">
        {fontFamilies.map((item, index) => (
          <div
            className="col-12 font-card d-flex align-items-center justify-content-between p-2"
            key={index}
            onClick={() => handleFontSelect(item)}
            style={{ cursor: "pointer" }}
          >
            {/* Font name (no font change) */}
            <span className="font-name" style={{ fontFamily: item.fontFamily }}>
              {item.name}
            </span>

            {/* Show Font Awesome check icon only if selected */}
            {selectedFont.fontFamily === item.fontFamily && (
              <span className="text-primary">
                <i className="fa fa-check"></i>
              </span>
            )}

            {/* Hidden radio input for accessibility */}
            <input
              type="radio"
              name="font_family"
              value={item.fontFamily}
              checked={selectedFont.fontFamily === item.fontFamily}
              onChange={() => handleFontSelect(item)}
              style={{ display: "none" }}
              id={`font_family_${item.id}`}
            />
          </div>
        ))}

      </div>
    </div>
  );
};

export default FontFamily;
