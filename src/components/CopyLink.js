import React, { useState } from 'react'
import { Button, InputGroup, FormControl } from 'react-bootstrap'

const copyToClipboard = (text) => {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}

function CopyLink(props) {
    const [hasCopiedURL, setHasCopiedURL] = useState(false)
    return (
        <InputGroup style={{ width: (props.url.length - 3) + "ch" }} size='sm'>
            <FormControl
                id="formURL"
                value={props.url}
                onClick={() => document.getElementById("formURL").select()}
                readOnly
            />
            <InputGroup.Append>
                <Button
                    onClick={(event) => { copyToClipboard(props.url); setHasCopiedURL(true); document.getElementById("formURL").select() }}
                    variant="outline-primary">
                    {<i className={hasCopiedURL ? "fas fa-check" : "fas fa-link"}></i>}
                </Button>
            </InputGroup.Append>
        </InputGroup>
    )
}

export default CopyLink