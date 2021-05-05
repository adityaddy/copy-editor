// @flow
/**
 * Editable content area for rich text formatting that converts the formatted
 * text into a JSON representation of the text.
 */
import * as React from "react";
import ContentEditable from "react-contenteditable";
import JSONPretty from "react-json-pretty";
import ReactHtmlParser from "react-html-parser";
import styled from "styled-components";

import Colors from "./constants/colors";
import Spacing from "./constants/spacing";

const getPropFromStyle = (style) => {
    if (!style)
        return "normal"
    var properties = style.split(';')
    var isItalic = false
    try {
        isItalic = !!style.match(/italic/);
    } catch (error) {
        // console.log(error)
    }

    var isBold = false
    try {
        for (const property of properties) {
            var keyVal = property.split(':')
            const key = keyVal[0]
            const val = keyVal[1]
            if (key.includes('weight')) {
                if (val.includes('bold') || parseInt(val) >= 600) {
                    console.log("Weight: ", val)
                    isBold = true
                }
            }
        }
    } catch (error) {
        // console.log(error)
    }

    if (isItalic && !isBold) {
        return "italic";
    } else if (!isItalic && isBold) {
        return "bold"
    } else if (isItalic && isBold) {
        return "bold-italic"
    } else {
        return "normal"
    }
}

const parseNodes = (nodes, baseStyle = "normal") => {
    let parsed = [];
    for (const node of nodes) {
        const { attribs, children, data, name } = node;
        if (!name) {
            parsed = parsed.concat({
                style: baseStyle,
                content: data,
            });
        } else if (name === "b" || name === "strong") {
            parsed = parsed.concat(
                parseNodes(
                    children,
                    baseStyle === "italic" ? "bold-italic" : "bold"
                )
            );
        } else if (name === "i" || name === "em") {
            parsed = parsed.concat(
                parseNodes(
                    children,
                    baseStyle === "bold" ? "bold-italic" : "italic"
                )
            );
        } else if (name === "span") {
            const { style } = attribs;
            // The detection of attributes here might be too specific. Is this
            // really the best way to do this?

            const prop = getPropFromStyle(attribs.style)
            parsed = parsed.concat(parseNodes(children, prop));
            // var isItalic = false
            // try {
            //   isItalic = !!style.match(/italic/);  
            // } catch (error) {
            //   // console.log(error)
            // } 

            // var isBold = false
            // try {
            //   isBold = !!style.match(/weight:600/);

            // } catch (error) {
            //   // console.log(error)
            // }
            // if (isItalic && !isBold) {
            //     parsed = parsed.concat(parseNodes(children, "italic"));
            // } else if (!isItalic && isBold) {
            //     parsed = parsed.concat(parseNodes(children, "bold"));
            // } else if (isItalic && isBold) {
            //     parsed = parsed.concat(parseNodes(children, "bold-italic"));
            // } else {
            //     parsed = parsed.concat(parseNodes(children, "normal"));
            // }
        } else {
            const prop = getPropFromStyle(attribs.style)
            parsed = parsed.concat(parseNodes(children, prop));

        }
    }
    return parsed;
};

const parseHtml = (html) =>
    ReactHtmlParser(html, {
        transform: (node, i) => {
            const { children, name, parent } = node;
            if (!parent && name === "div") {
                const parsed = parseNodes(children);
                return parsed.length > 0
                    ? {
                        content: parsed,
                    }
                    : null;
            } else {
                return null;
            }
        },
    }).filter((node) => !!node);

const App = () => {
    const [html, setHtml] = React.useState("<div>Edit text here.</div>");
    const [parsed, setParsed] = React.useState(parseHtml(html));

    const handleChange = (e) => {
        setHtml(e.target.value);
    };

    React.useEffect(() => {
        const parsedHtml = parseHtml("<div>" + html + "</div>");
        setParsed(parsedHtml);
    }, [html]);

    return (
        <Wrapper>
            <ContentEditable
                html={html}
                onChange={handleChange}
                style={{
                    flex: 1,
                    maxWidth: "50vw",
                    fontSize: "17px",
                    fontFamily: "sans-serif",
                    fontWeight: 300,
                    lineHeight: "24px",
                    height: "100vh",
                    borderRight: `1px solid ${Colors.offBlack}`,
                    padding: `${Spacing.small}px`,
                }}
            />
            <Strut size={24} />
            <JSONPretty
                data={parsed}
                style={{
                    flex: 1,
                    overflowX: "scroll",
                }}
            />
        </Wrapper>
    );
};

const Wrapper = styled.div`
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    width: 100%;
`;

const Strut = styled.div`
    flex-basis: ${(props) => props.size}px;
`;

export default App;
