// Copyright (c) Tensorware.
// Distributed under the terms of the Modified BSD License.

import $ from 'jquery';

export function round_to(value: number, multiple: number): number {
    return multiple * Math.round(value / multiple);
}

export function clamp_value(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export function hex_to_rgb(hex: string): string {
    if (!(hex || '').includes('#')) {
        return hex;
    }
    const str = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => '#' + r + r + g + g + b + b);
    const [r, g, b] = (str.substring(1).match(/.{2}/g) || []).map((x) => parseInt(x, 16));
    return `rgb(${r}, ${g}, ${b})`;
}

export function rgba_to_rgb(fgrgba: string, bgrgb: string): string {
    if (!(fgrgba || '').includes('rgba') || !(bgrgb || '').includes('rgb')) {
        return fgrgba;
    }
    const [fgr, fgg, fgb, fga] = $.map(fgrgba.substring(fgrgba.indexOf('(') + 1, fgrgba.lastIndexOf(')')).split(/,\s*/), Number);
    const [bgr, bgg, bgb] = $.map(bgrgb.substring(bgrgb.indexOf('(') + 1, bgrgb.lastIndexOf(')')).split(/,\s*/), Number);
    const fgrgb = {
        r: Math.round((fga * (fgr / 255) + (1 - fga) * (bgr / 255)) * 255),
        g: Math.round((fga * (fgg / 255) + (1 - fga) * (bgg / 255)) * 255),
        b: Math.round((fga * (fgb / 255) + (1 - fga) * (bgb / 255)) * 255)
    };
    return `rgb(${fgrgb.r}, ${fgrgb.g}, ${fgrgb.b})`;
}

export function rgba_background(target: JQuery<HTMLElement>) {
    const elements = target.parents().addBack();
    const parents = elements.filter((i: number, p: HTMLElement) => {
        return !['', 'undefined', 'transparent', 'rgba(0, 0, 0, 0)'].includes($(p).css('background-color'));
    });
    return parents.last().css('background-color');
}

export function class_suffix(target: JQuery<HTMLElement>, match: string): string {
    const classes = (target.attr('class') || '').split(/\s+/);
    const result = $.grep(classes, (x) => x.indexOf(match) === 0).join();
    return result.split('-').pop() || '';
}

export function class_rotate(target: JQuery<HTMLElement>, classes: string[]): string {
    for (let i = 0; i < classes.length; i++) {
        if (target.hasClass(classes[i])) {
            target.removeClass(classes[i]);
            i = i >= classes.length ? 0 : i + 1;
            if (classes[i]) {
                target.addClass(classes[i]);
            }
            return classes[i];
        }
    }
    target.addClass(classes[0]);
    return classes[0];
}

export function log_msg(ctx: object, json: string): void {
    const log = JSON.parse(json);
    const date = new Date(parseInt(log.date)).toLocaleString();

    const msg = `${date}, ${log.source}: ${log.message}`;
    switch (log.level) {
        case 0:
            console.debug(msg);
            break;
        case 1:
            console.info(msg);
            break;
        case 2:
            console.warn(msg);
            break;
        case 3:
            console.error(msg);
            break;
        default:
            console.log(msg);
    }
}
