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

export function rgb_to_rgba(rgb: string): string {
    if (!(rgb || '').includes('rgb(')) {
        return rgb;
    }
    return rgb.replace(/rgb/i, 'rgba').replace(/\)/i, ', 1.0)');
}

export function rgba_to_rgb(rgba_fg: string, rgb_bg: string): string {
    if (!(rgba_fg || '').includes('rgba(') || !(rgb_bg || '').includes('rgb(')) {
        return rgba_fg;
    }
    const [r_fg, g_fg, b_fg, a_fg] = $.map(rgba_fg.substring(rgba_fg.indexOf('(') + 1, rgba_fg.lastIndexOf(')')).split(/,\s*/), Number);
    const [r_bg, g_bg, b_bg] = $.map(rgb_bg.substring(rgb_bg.indexOf('(') + 1, rgb_bg.lastIndexOf(')')).split(/,\s*/), Number);
    const rgb_fg = {
        r: Math.round((a_fg * (r_fg / 255) + (1 - a_fg) * (r_bg / 255)) * 255),
        g: Math.round((a_fg * (g_fg / 255) + (1 - a_fg) * (g_bg / 255)) * 255),
        b: Math.round((a_fg * (b_fg / 255) + (1 - a_fg) * (b_bg / 255)) * 255)
    };
    return `rgb(${rgb_fg.r}, ${rgb_fg.g}, ${rgb_fg.b})`;
}

export function rgba_background(target: JQuery<HTMLElement>): string {
    const elements = target.parents().addBack();
    const parents = elements.filter((i: number, p: HTMLElement) => {
        return !['', 'undefined', 'transparent', 'rgba(0, 0, 0, 0)'].includes($(p).css('background-color'));
    });
    const color = parents.last().css('background-color');
    return rgb_to_rgba(hex_to_rgb(color || ''));
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
