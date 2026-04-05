type MeasurementBodyMapProps = {
  activeField: string;
};

export function MeasurementBodyMap({ activeField }: MeasurementBodyMapProps) {
  const activeStroke = "var(--app-accent)";
  const baseStroke = "var(--app-border-strong)";
  const softStroke = "var(--app-border)";
  const guideColor = (fields: string[]) => (fields.includes(activeField) ? activeStroke : softStroke);
  const guideWidth = (fields: string[]) => (fields.includes(activeField) ? 1.6 : 1);

  return (
    <div className="relative h-[300px] w-[228px] md:h-[332px] md:w-[250px] min-[1000px]:h-[402px] min-[1000px]:w-[304px]">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320" fill="none" className="h-full w-full" aria-hidden="true">
        <g stroke={baseStroke} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M120 22
               C111 22 105 29 105 39
               C105 51 112 59 120 59
               C128 59 135 51 135 39
               C135 29 129 22 120 22Z"
          />
          <path d="M113 59 L113 68" />
          <path d="M127 59 L127 68" />
          <path
            d="M92 82
               C99 73 108 68 120 68
               C132 68 141 73 148 82
               L149 96
               C150 110 149 123 147 136
               L145 152
               C143 166 141 180 139 194
               L136 214
               L133 300
               L126 300
               L123 232
               C122.5 223 117.5 223 117 232
               L114 300
               L107 300
               L104 214
               L101 194
               C99 180 97 166 95 152
               L93 136
               C91 123 90 110 91 96
               L92 82Z"
          />
          <path
            d="M92 84
               L79 108
               C75 116 73 127 73 137
               L73 171
               C73 179 76 183 80 183
               C84 183 87 179 87 171
               L89 144"
          />
          <path
            d="M148 84
               L161 108
               C165 116 167 127 167 137
               L167 171
               C167 179 164 183 160 183
               C156 183 153 179 153 171
               L151 144"
          />
          <path d="M120 194 L120 236" />
          <path d="M107 300 C102 305 94 308 86 308" />
          <path d="M133 300 C138 305 146 308 154 308" />

          <path d="M92 80 L148 80" stroke={guideColor(["Shoulder"])} strokeWidth={guideWidth(["Shoulder"])} strokeDasharray="3 4" />
          <path d="M92 76 L92 84" stroke={guideColor(["Shoulder"])} strokeWidth={guideWidth(["Shoulder"])} />
          <path d="M148 76 L148 84" stroke={guideColor(["Shoulder"])} strokeWidth={guideWidth(["Shoulder"])} />
          <path d="M106 66 L134 66" stroke={guideColor(["Neck"])} strokeWidth={guideWidth(["Neck"])} strokeDasharray="3 4" />
          <path d="M84 109 L156 109" stroke={guideColor(["Chest"])} strokeWidth={guideWidth(["Chest"])} strokeDasharray="3 4" />
          <path d="M87 126 L153 126" stroke={guideColor(["Stomach"])} strokeWidth={guideWidth(["Stomach"])} strokeDasharray="3 4" />
          <path d="M86 142 L154 142" stroke={guideColor(["Waist"])} strokeWidth={guideWidth(["Waist"])} strokeDasharray="3 4" />
          <path d="M84 170 L156 170" stroke={guideColor(["Seat"])} strokeWidth={guideWidth(["Seat"])} strokeDasharray="3 4" />
          <path d="M75 118 L89 118" stroke={guideColor(["Bicep"])} strokeWidth={guideWidth(["Bicep"])} strokeDasharray="3 4" />
          <path d="M151 118 L165 118" stroke={guideColor(["Bicep"])} strokeWidth={guideWidth(["Bicep"])} strokeDasharray="3 4" />
          <path
            d="M148 84
               L161 108
               C165 116 167 127 167 137
               L167 171"
            stroke={guideColor(["Sleeve Length"])}
            strokeWidth={guideWidth(["Sleeve Length"])}
            strokeDasharray="3 4"
          />
          <path d="M98 214 L142 214" stroke={guideColor(["Thigh"])} strokeWidth={guideWidth(["Thigh"])} strokeDasharray="3 4" />
          <path d="M120 170 L120 214" stroke={guideColor(["Rise"])} strokeWidth={guideWidth(["Rise"])} strokeDasharray="3 4" />
          <path d="M79 176 L90 176" stroke={guideColor(["Shirt Cuff Left"])} strokeWidth={guideWidth(["Shirt Cuff Left"])} strokeDasharray="3 4" />
          <path d="M150 176 L161 176" stroke={guideColor(["Shirt Cuff Right"])} strokeWidth={guideWidth(["Shirt Cuff Right"])} strokeDasharray="3 4" />
          <path d="M86 286 L154 286" stroke={guideColor(["Bottom"])} strokeWidth={guideWidth(["Bottom"])} strokeDasharray="3 4" />
          <path d="M178 22 L178 300" stroke={guideColor(["Back Length", "Length"])} strokeWidth={guideWidth(["Back Length", "Length"])} strokeDasharray="3 4" />
          <path d="M174 22 L182 22" stroke={guideColor(["Back Length", "Length"])} strokeWidth={guideWidth(["Back Length", "Length"])} />
          <path d="M174 300 L182 300" stroke={guideColor(["Back Length", "Length"])} strokeWidth={guideWidth(["Back Length", "Length"])} />
        </g>
      </svg>
    </div>
  );
}
